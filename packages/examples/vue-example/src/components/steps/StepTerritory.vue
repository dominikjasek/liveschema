<script setup lang="ts">
import { useField } from 'vee-validate'
import { territories, type FieldValue } from '@/schemas'
const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<FieldValue<'territory'>>(() => props.path)
</script>

<template>
  <h2>Territory type?</h2>
  <div class="options">
    <label v-for="o in territories" :key="o" class="radio">
      <input v-model="value" type="radio" :value="o" />
      <span>{{ o }}</span>
    </label>
  </div>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
