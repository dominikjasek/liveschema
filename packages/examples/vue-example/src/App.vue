<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useForm } from 'vee-validate'
import { activeFields, toStandardSchema, type FormField } from 'form-flow'
import StepReview from './components/StepReview.vue'
import { resolveStep, stepLabels as stepLabelMap, type StepBinding } from './components/steps'
import { form as orderForm, type Order, type FieldKey } from '@/schemas'

type Phase = 'fill' | 'review'

// Wizard-level grouping: keys listed together render on a single step.
// Any field not listed here becomes a step by itself, labeled via `stepLabelMap`.
type StepGroup = { label: string; keys: readonly FieldKey[] }
const stepGroups: readonly StepGroup[] = [
  { label: 'Contact info', keys: ['email', 'fullName'] },
  { label: 'Order type', keys: ['orderType', 'leaveAtDoor'] },
]

type ResolvedStep = { label: string; fields: FormField[] }

function humanize(field: string): string {
  return (
    stepLabelMap[field] ??
    field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
  )
}

function groupSteps(active: FormField[]): ResolvedStep[] {
  const groupOf = new Map<string, StepGroup>()
  for (const grp of stepGroups) for (const k of grp.keys) groupOf.set(k, grp)
  const out: ResolvedStep[] = []
  const placed = new Set<StepGroup>()
  for (const field of active) {
    const grp = groupOf.get(field.key)
    if (grp) {
      if (placed.has(grp)) continue
      placed.add(grp)
      out.push({
        label: grp.label,
        fields: active.filter((f) => grp.keys.includes(f.key as FieldKey)),
      })
    } else {
      out.push({ label: humanize(field.key), fields: [field] })
    }
  }
  return out
}

const phase = ref<Phase>('fill')
const stepIndex = ref(0)

const form = useForm<Order>({
  keepValuesOnUnmount: true,
  validationSchema: toStandardSchema(orderForm),
})

const currentActiveFields = computed<FormField[]>(() =>
  activeFields(orderForm, form.values as Record<string, unknown>),
)

const currentSteps = computed<ResolvedStep[]>(() => groupSteps(currentActiveFields.value))

const currentStep = computed<ResolvedStep | undefined>(() => {
  if (phase.value !== 'fill') return undefined
  return currentSteps.value[stepIndex.value]
})

// When an upstream choice changes, the walker yields a different ordered list
// of steps, and the active stepIndex may now point past the last reachable
// step. Clamp it.
watch(
  () => currentSteps.value.length,
  (len) => {
    if (phase.value === 'fill' && stepIndex.value >= len) {
      stepIndex.value = Math.max(0, len - 1)
    }
  },
)

const currentBindings = computed<StepBinding[]>(() => {
  const step = currentStep.value
  if (!step) return []
  return step.fields.map(resolveStep).filter((b): b is StepBinding => !!b)
})

const stepLabels = computed(() => [...currentSteps.value.map((s) => s.label), 'Review'])

const activeIndex = computed(() => {
  if (phase.value === 'review') return stepLabels.value.length - 1
  return stepIndex.value
})

async function goNext() {
  if (phase.value !== 'fill') return
  const step = currentStep.value
  if (!step) return
  const results = await Promise.all(
    step.fields.map((f) => form.validateField(f.key as never)),
  )
  if (results.some((r) => !r.valid)) return
  // Persist the parsed (potentially coerced) value so downstream branches
  // see e.g. a real number for `pizzaCount` rather than the raw string.
  step.fields.forEach((f, i) => {
    const value = results[i].value
    if (value !== undefined) form.setFieldValue(f.key as never, value as never)
  })
  if (stepIndex.value < currentSteps.value.length - 1) {
    stepIndex.value++
  } else {
    phase.value = 'review'
  }
}

function goBack() {
  if (phase.value === 'review') {
    phase.value = 'fill'
    stepIndex.value = currentSteps.value.length - 1
    return
  }
  if (stepIndex.value > 0) stepIndex.value--
}

function jumpTo(i: number) {
  if (i > activeIndex.value) return
  if (i === stepLabels.value.length - 1) {
    phase.value = 'review'
  } else {
    phase.value = 'fill'
    stepIndex.value = i
  }
}

function submit() {
  alert(`Order submitted!\n\n${JSON.stringify(form.values, null, 2)}`)
}
</script>

<template>
  <header>
    <h1>Vue vee-validate multi-step form</h1>
  </header>
  <main>
    <section class="form">
      <ol class="stepper">
        <li v-for="(label, i) in stepLabels" :key="i">
          <button
            type="button"
            :class="{ active: activeIndex === i, done: activeIndex > i }"
            :disabled="i > activeIndex"
            :title="label"
            @click="jumpTo(i)"
          >
            <span class="step-num">{{ i + 1 }}</span>
            <span class="step-label">{{ label }}</span>
          </button>
        </li>
      </ol>

      <div class="content">
        <form v-if="phase === 'fill'" class="step" @submit.prevent="goNext">
          <component
            :is="binding.component"
            v-for="binding in currentBindings"
            :key="(binding.props as { path: string }).path"
            v-bind="binding.props"
          />
          <div class="actions">
            <button v-if="stepIndex > 0" type="button" @click="goBack">Back</button>
            <button type="submit">
              {{ stepIndex === currentSteps.length - 1 ? 'Review' : 'Next' }}
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

        <pre class="debug">{{ JSON.stringify({ values: form.values, stepIndex, steps: currentActiveFields.map((s) => s.key) }, null, 2) }}</pre>
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
