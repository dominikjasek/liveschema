<script setup lang="ts">
import { useField } from 'vee-validate'
import type { FieldValue } from '@/schemas'
const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<FieldValue<'email'> | undefined>(() => props.path)
</script>

<template>
  <h2>Your email</h2>
  <label class="field">
    <input v-model="value" class="text-input" type="email" />
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
  width: 18rem;
}
</style>
