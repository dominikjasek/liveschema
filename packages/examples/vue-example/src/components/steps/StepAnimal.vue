<script setup lang="ts">
import { useField } from 'vee-validate'
import { animals, type FieldValue } from '@/schemas'
const props = defineProps<{ path: string }>()
const { value, errorMessage } = useField<FieldValue<'animal'>>(() => props.path)
</script>

<template>
  <h2>What kind of animal would you like to adopt?</h2>
  <div class="options">
    <label v-for="o in animals" :key="o" class="radio">
      <input v-model="value" type="radio" :value="o" />
      <span>{{ o }}</span>
    </label>
  </div>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
