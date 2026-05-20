<script setup lang="ts">
import { useField } from 'vee-validate'
const props = defineProps<{
  path: string
  question: string
  min?: number
  max?: number
}>()
const { value, errorMessage } = useField<number | undefined>(() => props.path)
</script>

<template>
  <h2>{{ question }}</h2>
  <label class="field">
    <input
      v-model.number="value"
      class="text-input"
      type="number"
      :min="props.min"
      :max="props.max"
    />
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </label>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.75rem;
}
.text-input {
  padding: 0.4rem 0.6rem;
  font-size: 1rem;
  background: #1f1f1f;
  border: 1px solid #333;
  border-radius: 4px;
  color: white;
  width: 8rem;
}
</style>
