<script setup lang="ts">
import { useField } from 'vee-validate'
import type { FieldValue } from '@/schemas'
const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<FieldValue<'ownerName'>>(() => props.path)
</script>

<template>
  <h2>Your name</h2>
  <input class="text-input" type="text" v-model="value" />
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>

<style scoped>
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
