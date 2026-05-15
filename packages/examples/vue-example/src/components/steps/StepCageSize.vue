<script setup lang="ts">
import { useField } from 'vee-validate'
import { cageSizes, type FieldValue } from '@/schemas'
const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<FieldValue<'cageSize'>>(() => props.path)
</script>

<template>
  <h2>Cage shape?</h2>
  <div class="options">
    <label v-for="o in cageSizes" :key="o" class="radio">
      <input v-model="value" type="radio" :value="o" />
      <span>{{ o }}</span>
    </label>
  </div>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
