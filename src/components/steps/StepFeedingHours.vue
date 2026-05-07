<script setup lang="ts">
import { useField } from 'vee-validate'
import { feedingHourOptions, type FieldValue } from '@/schemas'

const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<FieldValue<'feedingHours'>>(() => props.path)

function toggle(opt: number, checked: boolean) {
  const cur = Array.isArray(value.value) ? [...value.value] : []
  value.value = checked
    ? [...new Set([...cur, opt])].sort((a, b) => a - b)
    : cur.filter((n) => n !== opt)
}

function isPicked(opt: number): boolean {
  return Array.isArray(value.value) && value.value.includes(opt)
}
</script>

<template>
  <h2>Pick daily feeding hours (24h clock)</h2>
  <div class="options">
    <label v-for="o in feedingHourOptions" :key="o" class="radio">
      <input
        type="checkbox"
        :checked="isPicked(o)"
        @change="toggle(o, ($event.target as HTMLInputElement).checked)"
      />
      <span>{{ o }}</span>
    </label>
  </div>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
