<script setup lang="ts">
import { listSteps } from '@/composables/useFormWalker'

const props = defineProps<{ data: Record<string, unknown> }>()

const reviewItems = () =>
  listSteps(props.data).map((step) => ({
    key: step.key,
    value: step.value,
  }))

function display(value: unknown): string {
  if (value === undefined || value === null) return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${display(v)}`)
      .join(' · ')
  }
  return String(value)
}

function humanize(field: string): string {
  return field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}
</script>

<template>
  <h2>Review</h2>
  <dl class="review">
    <template v-for="item in reviewItems()" :key="item.key">
      <dt>{{ humanize(item.key) }}</dt>
      <dd>{{ display(item.value) }}</dd>
    </template>
  </dl>
</template>

<style scoped>
.review {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 0.4rem 1rem;
}
.review dt {
  color: #888;
  font-size: 0.85rem;
}
.review dd {
  margin: 0;
}
</style>
