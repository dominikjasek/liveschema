<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { animalTypes, step1Schema, type AnimalType } from '../schemas'

const props = defineProps<{ initial?: AnimalType }>()
const emit = defineEmits<{ next: [animalType: AnimalType] }>()

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(step1Schema),
  initialValues: { animalType: props.initial },
})

const [animalType] = defineField('animalType')

const onSubmit = handleSubmit((values) => {
  emit('next', values.animalType)
})
</script>

<template>
  <form @submit.prevent="onSubmit" class="step">
    <h2>Step 1 — Pick animal type</h2>
    <div class="options">
      <label v-for="t in animalTypes" :key="t" class="radio">
        <input type="radio" :value="t" v-model="animalType" />
        <span>{{ t }}</span>
      </label>
    </div>
    <p v-if="errors.animalType" class="error">{{ errors.animalType }}</p>
    <div class="actions">
      <button type="submit">Next</button>
    </div>
  </form>
</template>
