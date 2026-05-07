<script setup lang="ts">
import { useField } from 'vee-validate'
import { scratchPostOptions } from '@/schemas'
const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<string>(() => props.path)
</script>

<template>
  <h2>Will you provide a scratch post?</h2>
  <div class="options">
    <label v-for="o in scratchPostOptions" :key="o" class="radio">
      <input type="radio" :value="o" v-model="value" />
      <span>{{ o }}</span>
    </label>
  </div>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
