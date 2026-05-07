<script setup lang="ts">
import { useField } from 'vee-validate'
import { enrichmentOptions, type FieldValue } from '@/schemas'
const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<FieldValue<'enrichment'>>(() => props.path)
</script>

<template>
  <h2>Enrichment style?</h2>
  <div class="options">
    <label v-for="o in enrichmentOptions" :key="o" class="radio">
      <input type="radio" :value="o" v-model="value" />
      <span>{{ o }}</span>
    </label>
  </div>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
