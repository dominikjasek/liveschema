<script setup lang="ts">
import { ref, computed } from 'vue'
import StepAnimalType from './StepAnimalType.vue'
import StepDetails from './StepDetails.vue'
import StepLiving from './StepLiving.vue'
import StepReview from './StepReview.vue'
import {
  detailsSchemaFor,
  type Adoption,
  type AnimalType,
  type DetailsByType,
  type LivingSituation,
} from '@/schemas'

type State = {
  animalType?: AnimalType
  details?: DetailsByType[AnimalType]
  living?: LivingSituation
}

const step = ref<1 | 2 | 3 | 4>(1)
const state = ref<State>({})
const detailsRevalidationError = ref<string | null>(null)

const adoption = computed<Adoption | null>(() => {
  const { animalType, living, details } = state.value
  if (!animalType || !living || !details) return null
  return { animalType, living, details } as Adoption
})

function onPickType(animalType: AnimalType) {
  if (state.value.animalType !== animalType) {
    state.value.details = undefined
  }
  state.value.animalType = animalType
  step.value = 2
}

function onSubmitDetails(details: DetailsByType[AnimalType]) {
  state.value.details = details
  detailsRevalidationError.value = null
  step.value = 3
}

function onPickLiving(living: LivingSituation) {
  state.value.living = living
  // Re-check step 2 against the now-known living constraints.
  if (state.value.animalType && state.value.details) {
    const schema = detailsSchemaFor(state.value.animalType, living)
    const result = schema.safeParse(state.value.details)
    if (!result.success) {
      detailsRevalidationError.value =
        result.error.issues[0]?.message ?? 'Details no longer valid for this living situation'
      step.value = 2
      return
    }
  }
  step.value = 4
}

function submit() {
  if (!adoption.value) return
  // eslint-disable-next-line no-alert
  alert(`Adoption submitted!\n\n${JSON.stringify(adoption.value, null, 2)}`)
}
</script>

<template>
  <section class="form">
    <ol class="stepper">
      <li :class="{ active: step === 1, done: step > 1 }">Animal</li>
      <li :class="{ active: step === 2, done: step > 2 }">Details</li>
      <li :class="{ active: step === 3, done: step > 3 }">Living</li>
      <li :class="{ active: step === 4 }">Review</li>
    </ol>

    <p v-if="detailsRevalidationError && step === 2" class="banner">
      {{ detailsRevalidationError }}
    </p>

    <StepAnimalType
      v-if="step === 1"
      :initial="state.animalType"
      @next="onPickType"
    />

    <StepDetails
      v-else-if="step === 2 && state.animalType"
      :key="state.animalType"
      :animal-type="state.animalType"
      :living="state.living"
      :initial="state.details"
      @next="onSubmitDetails"
      @back="step = 1"
    />

    <StepLiving
      v-else-if="step === 3"
      :initial="state.living"
      @next="onPickLiving"
      @back="step = 2"
    />

    <StepReview
      v-else-if="step === 4 && adoption"
      :data="adoption"
      @submit="submit"
      @back="step = 3"
    />
  </section>
</template>

<style scoped>
.form {
  max-width: 520px;
  margin: 2rem auto;
  font-family: system-ui, sans-serif;
  text-align: left;
}
.stepper {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  padding: 0;
  margin: 0 0 1.5rem;
  counter-reset: step;
}
.stepper li {
  flex: 1;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  background: #1f1f1f;
  color: #888;
  font-size: 0.85rem;
  counter-increment: step;
}
.stepper li::before {
  content: counter(step) '. ';
  font-weight: 600;
}
.stepper li.active {
  background: #2c5282;
  color: white;
}
.stepper li.done {
  background: #2f4f2f;
  color: #ddd;
}
.banner {
  background: #4a2222;
  color: #ffb4b4;
  padding: 0.6rem 0.8rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}
</style>
