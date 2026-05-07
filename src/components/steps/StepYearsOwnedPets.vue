<script setup lang="ts">
import { useField } from 'vee-validate'
const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<number>(() => props.path)
</script>

<template>
  <h2>How many years have you owned pets?</h2>
  <input
    class="number-input"
    type="number"
    min="0"
    max="80"
    :value="typeof value === 'number' ? value : ''"
    @input="value = ($event.target as HTMLInputElement).valueAsNumber"
  />
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>

<style scoped>
.number-input {
  padding: 0.4rem 0.6rem;
  font-size: 1rem;
  background: #1f1f1f;
  border: 1px solid #333;
  border-radius: 4px;
  color: white;
  width: 8rem;
}
</style>
