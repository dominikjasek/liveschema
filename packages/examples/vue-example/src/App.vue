<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { activeFields, reachableKeys, type FormField } from 'form-flow'
import StepReview from './components/StepReview.vue'
import { resolveStep, stepLabels as stepLabelMap } from './components/steps'
import { form as orderForm, type Order } from '@/schemas'

type Phase = 'fill' | 'review'

const phase = ref<Phase>('fill')
const stepIndex = ref(0)

const form = useForm<Order>({
  keepValuesOnUnmount: true,
})

const steps = computed<FormField[]>(() =>
  activeFields(orderForm, form.values as Record<string, unknown>),
)

// Strip values from branches the user has abandoned (e.g. `pizzaSize`
// after switching `mainCourse` from 'pizza' to 'salad'). vee-validate
// keeps the raw bag around; we only ever want reachable keys.
const cleanValues = computed(() => {
  const data = form.values as Record<string, unknown>
  const keep = reachableKeys(orderForm, data)
  return Object.fromEntries(Object.entries(data).filter(([k]) => keep.has(k)))
})

const currentStep = computed<FormField | undefined>(() => {
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

const currentBinding = computed(() => {
  const step = currentStep.value
  if (!step) return undefined
  return resolveStep(step)
})

function humanize(field: string): string {
  return (
    stepLabelMap[field] ??
    field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
  )
}

const stepLabels = computed(() => [...steps.value.map((s) => s.key), 'review'])

const activeIndex = computed(() => {
  if (phase.value === 'review') return stepLabels.value.length - 1
  return stepIndex.value
})

async function goNext() {
  if (phase.value !== 'fill') return
  const step = currentStep.value
  if (!step) return
  const value = (form.values as Record<string, unknown>)[step.key]
  const result = step.schema['~standard'].validate(value)
  if (result instanceof Promise) return // demo: leaf validators are sync
  if (result.issues) {
    for (const issue of result.issues) {
      const segs = (issue.path ?? []).map((p) =>
        typeof p === 'object' ? String(p.key) : String(p),
      )
      const issuePath = segs.length ? `${step.key}.${segs.join('.')}` : step.key
      form.setFieldError(issuePath as never, issue.message)
    }
    return
  }
  // Persist the parsed (potentially coerced) value back into form state.
  form.setFieldValue(step.key as never, result.value as never)
  if (stepIndex.value < steps.value.length - 1) {
    stepIndex.value++
  } else {
    phase.value = 'review'
  }
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

function submit() {
  alert(`Order submitted!\n\n${JSON.stringify(cleanValues.value, null, 2)}`)
}
</script>

<template>
  <header>
    <h1>Place an Order</h1>
  </header>
  <main>
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
        <form v-if="phase === 'fill'" class="step" @submit.prevent="goNext">
          <component
            :is="currentBinding.component"
            v-if="currentStep && currentBinding"
            :key="currentStep.key"
            v-bind="currentBinding.props"
          />
          <div class="actions">
            <button v-if="stepIndex > 0" type="button" @click="goBack">Back</button>
            <button type="submit">
              {{ stepIndex === steps.length - 1 ? 'Review' : 'Next' }}
            </button>
          </div>
        </form>

        <template v-else>
          <StepReview :data="cleanValues" />
          <div class="actions">
            <button type="button" @click="goBack">Back</button>
            <button type="button" @click="submit">Submit</button>
          </div>
        </template>

        <pre class="debug">{{ JSON.stringify({ values: cleanValues, stepIndex, steps: steps.map((s) => s.key) }, null, 2) }}</pre>
      </div>
    </section>
  </main>
</template>

<style scoped>
header {
  text-align: center;
  margin-top: 2rem;
}
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
