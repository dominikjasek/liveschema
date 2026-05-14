<script setup lang="ts">
import { useField } from 'vee-validate'
import type { FieldValue } from '@/schemas'

const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<FieldValue<'ownerEmail'>>(() => props.path)
</script>

<template>
  <div>
    <h2>What's your email?</h2>
    <label class="field">
      <input class="text-input" type="email" v-model="value" />
    </label>
    <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
  </div>
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
