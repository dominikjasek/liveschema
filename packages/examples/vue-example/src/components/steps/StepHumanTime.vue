<script setup lang="ts">
import { useField } from 'vee-validate'
import { humanTimes, type FieldValue } from '@/schemas'
const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<FieldValue<'humanTime'>>(() => props.path)
</script>

<template>
  <h2>Best human time?</h2>
  <div class="options">
    <label v-for="o in humanTimes" :key="o" class="radio">
      <input v-model="value" type="radio" :value="o" />
      <span>{{ o }}</span>
    </label>
  </div>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
