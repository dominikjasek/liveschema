<script setup lang="ts">
import { useField } from 'vee-validate'
const props = defineProps<{
  path: string
  question: string
  confirmLabel?: string
}>()
const { value, errorMessage } = useField<boolean | undefined>(() => props.path)
</script>

<template>
  <h2>{{ question }}</h2>
  <label class="confirm">
    <input
      type="checkbox"
      :checked="value === true"
      @change="value = ($event.target as HTMLInputElement).checked"
    />
    <span>{{ props.confirmLabel ?? 'Yes' }}</span>
  </label>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>

<style scoped>
.confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  cursor: pointer;
}
</style>
