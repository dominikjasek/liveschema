<script setup lang="ts">
import { useField } from 'vee-validate'
import type { FieldValue } from '@/schemas'
const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<FieldValue<'noDogAtHome'> | undefined>(() => props.path)
</script>

<template>
  <h2>I confirm I do not own a dog at home (dogs and cats often do not get along).</h2>
  <label class="confirm">
    <input
      type="checkbox"
      :checked="value === true"
      @change="value = ($event.target as HTMLInputElement).checked ? true : undefined"
    />
    <span>I confirm</span>
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
