<script setup lang="ts">
import { ref, computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import StepAnimalType from './StepAnimalType.vue'
import StepDetails from './StepDetails.vue'
import StepLiving from './StepLiving.vue'
import StepReview from './StepReview.vue'
import {
  step1Schema,
  step2SchemaFor,
  step3Schema,
} from '@/schemas'
import { type FormShape } from '@/composables/useTypedForm'

const currentStep = ref(0)

let form!: ReturnType<typeof useForm<FormShape>>

const stepSchemas = computed(() => [
  toTypedSchema(step1Schema),
  toTypedSchema(step2SchemaFor(form?.values.animalType ?? 'dog')),
  toTypedSchema(step3Schema),
])

const currentSchema = computed(() => stepSchemas.value[currentStep.value])

form = useForm<FormShape>({
  validationSchema: currentSchema as never,
  keepValuesOnUnmount: true,
})

const isReview = computed(() => currentStep.value === 3)

const goNext = form.handleSubmit(() => {
  currentStep.value++
})

function goBack() {
  if (currentStep.value > 0) currentStep.value--
}

const adoption = computed(() => {
  return form.values
})


function submit() {
  if (!adoption.value) return
  // eslint-disable-next-line no-alert
  alert(`Adoption submitted!\n\n${JSON.stringify(adoption.value, null, 2)}`)
}
</script>

<template>
  <section class="form">
    <ol class="stepper">
      <li v-for="(label, i) in ['Animal', 'Details', 'House', 'Review']" :key="label">
        <button
          type="button"
          :class="{ active: currentStep === i, done: currentStep > i }"
          @click="currentStep = i"
        >
          {{ label }}
        </button>
      </li>
    </ol>

    <form v-if="!isReview" @submit.prevent="goNext" class="step">
      <StepAnimalType v-if="currentStep === 0" />
      <StepDetails v-else-if="currentStep === 1" />
      <StepLiving v-else-if="currentStep === 2" />

      <div class="actions">
        <button v-if="currentStep > 0" type="button" @click="goBack">Back</button>
        <button type="submit">Next</button>
      </div>
    </form>

    <template v-else-if="adoption">
      <StepReview :data="adoption" />
      <div class="actions">
        <button type="button" @click="goBack">Back</button>
        <button type="button" @click="submit">Submit</button>
      </div>
    </template>
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
  counter-increment: step;
  list-style: none;
}
.stepper button {
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
}
.stepper button::before {
  content: counter(step) '. ';
  font-weight: 600;
}
.stepper button:hover {
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
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}
</style>
