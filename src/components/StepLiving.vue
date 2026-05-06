<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { livingSituations, step3Schema, type LivingSituation } from '@/schemas'

const props = defineProps<{ initial?: LivingSituation }>()
const emit = defineEmits<{
  next: [living: LivingSituation]
  back: []
}>()

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: toTypedSchema(step3Schema),
  initialValues: { living: props.initial },
})

const [living] = defineField('living')

const onSubmit = handleSubmit((v) => emit('next', v.living))
</script>

<template>
  <form @submit.prevent="onSubmit" class="step">
    <h2>Step 3 — Your living situation</h2>
    <div class="options">
      <label v-for="l in livingSituations" :key="l" class="radio">
        <input type="radio" :value="l" v-model="living" />
        <span>{{ l }}</span>
      </label>
    </div>
    <p v-if="errors.living" class="error">{{ errors.living }}</p>
    <div class="actions">
      <button type="button" @click="emit('back')">Back</button>
      <button type="submit">Next</button>
    </div>
  </form>
</template>
