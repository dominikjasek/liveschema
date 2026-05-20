<script setup lang="ts">
import { useField } from 'vee-validate'
const props = defineProps<{
  path: string
  question: string
  options: readonly string[]
}>()
const { value, errorMessage } = useField<string | undefined>(() => props.path)
</script>

<template>
  <h2>{{ question }}</h2>
  <div class="options">
    <label v-for="o in props.options" :key="o" class="radio">
      <input v-model="value" type="radio" :value="o" />
      <span>{{ o }}</span>
    </label>
  </div>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
