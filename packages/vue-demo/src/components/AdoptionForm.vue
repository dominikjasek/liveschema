<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import StepReview from './StepReview.vue'
import { stepComponents, stepLabels as stepLabelMap, type StepKey } from './steps'
import { listSteps, type Step } from '@/composables/useFormWalker'
import type { Adoption } from '@/schemas'

type Phase = 'fill' | 'review'

const phase = ref<Phase>('fill')
const stepIndex = ref(0)

const form = useForm<Adoption>({
  keepValuesOnUnmount: true,
})

// ✅ this works
if (form.values.animalType === "dog") {
  form.values.branch?.size
}


const steps = computed<Step[]>(() => listSteps(form.values))

const currentStep = computed<Step | undefined>(() => {
  if (phase.value !== 'fill') return undefined
  return steps.value[stepIndex.value]
})

// When an upstream choice changes, the walker yields a different ordered list
// of steps, and the active stepIndex may now point past the last reachable
// step. Clamp it.
watch(
  () => steps.value.length,
  (len) => {
    if (phase.value === 'fill' && stepIndex.value >= len) {
      stepIndex.value = Math.max(0, len - 1)
    }
  },
)

const currentComponent = computed(() => {
  const step = currentStep.value
  if (!step) return undefined
  return stepComponents[step.field as StepKey]
})

function humanize(field: string): string {
  return (
    stepLabelMap[field as StepKey] ??
    field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
  )
}

const stepLabels = computed(() => [...steps.value.map((s) => s.field), 'review'])
console.log("stepLabels", stepLabels.value)

const activeIndex = computed(() => {
  if (phase.value === 'review') return stepLabels.value.length - 1
  return stepIndex.value
})

async function goNext() {
  if (phase.value !== 'fill') return
  const step = currentStep.value
  if (!step) return
  const value = getAtPath(form.values, step.path)
  const result = step.schema.safeParse(value)
  if (!result.success) {
    // Compound steps (e.g. owner = name + email) can produce multiple errors;
    // attach each to its own nested path so the per-field component shows it.
    for (const issue of result.error.issues) {
      const issuePath = issue.path.length
        ? `${step.path}.${issue.path.join('.')}`
        : step.path
      form.setFieldError(issuePath as never, issue.message)
    }
    return
  }
  // Persist the parsed (potentially coerced) value back into form state.
  form.setFieldValue(step.path as never, result.data as never)
  if (stepIndex.value < steps.value.length - 1) {
    stepIndex.value++
  } else {
    phase.value = 'review'
  }
}

function getAtPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc === null || typeof acc !== 'object') return undefined
    return (acc as Record<string, unknown>)[key]
  }, obj)
}

function goBack() {
  if (phase.value === 'review') {
    phase.value = 'fill'
    stepIndex.value = steps.value.length - 1
    return
  }
  if (stepIndex.value > 0) stepIndex.value--
}

function jumpTo(i: number) {
  const labels = stepLabels.value
  if (i > activeIndex.value) return
  if (i === labels.length - 1) {
    phase.value = 'review'
  } else {
    phase.value = 'fill'
    stepIndex.value = i
  }
}

function flattenBranches(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input)) {
    const isPlainObject = v !== null && typeof v === 'object' && !Array.isArray(v)
    if (k === 'branch' && isPlainObject) {
      Object.assign(out, flattenBranches(v as Record<string, unknown>))
    } else if (isPlainObject) {
      out[k] = flattenBranches(v as Record<string, unknown>)
    } else {
      out[k] = v
    }
  }
  return out
}

function submit() {
  const payload = flattenBranches(form.values as Record<string, unknown>) as Adoption
  // eslint-disable-next-line no-alert
  alert(`Adoption submitted!\n\n${JSON.stringify(payload, null, 2)}`)
}
</script>

<template>
  <section class="form">
    <ol class="stepper">
      <li v-for="(label, i) in stepLabels" :key="i">
        <button
          type="button"
          :class="{ active: activeIndex === i, done: activeIndex > i }"
          :disabled="i > activeIndex"
          :title="humanize(label)"
          @click="jumpTo(i)"
        >
          <span class="step-num">{{ i + 1 }}</span>
          <span class="step-label">{{ humanize(label) }}</span>
        </button>
      </li>
    </ol>

    <div class="content">
      <form v-if="phase === 'fill'" @submit.prevent="goNext" class="step">
        <component
          v-if="currentStep && currentComponent"
          :is="currentComponent"
          :key="currentStep.path"
          :path="currentStep.path"
        />
        <div class="actions">
          <button v-if="stepIndex > 0" type="button" @click="goBack">Back</button>
          <button type="submit">
            {{ stepIndex === steps.length - 1 ? 'Review' : 'Next' }}
          </button>
        </div>
      </form>

      <template v-else>
        <StepReview :data="form.values" />
        <div class="actions">
          <button type="button" @click="goBack">Back</button>
          <button type="button" @click="submit">Submit</button>
        </div>
      </template>

      <pre class="debug">{{ JSON.stringify({ values: form.values, stepIndex, steps: steps.map((s) => s.field) }, null, 2) }}</pre>
    </div>
  </section>
</template>

<style scoped>
.form {
  max-width: 960px;
  margin: 2rem auto;
  font-family: system-ui, sans-serif;
  text-align: left;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}
.stepper {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 0 0 180px;
}
.stepper li {
  list-style: none;
}
.content {
  flex: 1;
  min-width: 0;
}
.stepper button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: none;
  background: #1f1f1f;
  color: #888;
  font-size: 0.85rem;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  white-space: nowrap;
  overflow: hidden;
}
.step-num {
  font-weight: 700;
  flex-shrink: 0;
}
.step-label {
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}
.stepper button:hover:not(:disabled) {
  filter: brightness(1.2);
}
.stepper button.active {
  background: #2c5282;
  color: white;
}
.stepper button.done {
  background: #2f4f2f;
  color: #ddd;
}
.stepper button:disabled {
  cursor: default;
  opacity: 0.6;
}
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
.debug {
  background: #111;
  color: #0f0;
  padding: 0.5rem;
  margin: 1rem 0 1rem;
  font-size: 0.7rem;
  border-radius: 4px;
  white-space: pre-wrap;
  overflow-x: auto;
}
</style>
