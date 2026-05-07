<script setup lang="ts">
import { animalTypes } from '@/schemas'
import { useTypedField } from '@/composables/useTypedForm'

const { value: animalType, errorMessage } = useTypedField('animalType')
</script>

<template>
  <h2>Step 1 — Pick animal type</h2>
  <div class="options">
    <label v-for="t in animalTypes" :key="t" class="radio">
      <input type="radio" :value="t" v-model="animalType" />
      <span>{{ t }}</span>
    </label>
  </div>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
