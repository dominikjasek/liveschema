<script setup lang="ts">
import { houseSizes } from '@/schemas'
import { useTypedField } from '@/composables/useTypedForm'

const { value: houseSize, errorMessage } = useTypedField('houseSize')
</script>

<template>
  <h2>Step 3 — House size</h2>
  <div class="options">
    <label v-for="s in houseSizes" :key="s" class="radio">
      <input type="radio" :value="s" v-model="houseSize" />
      <span>{{ s }}</span>
    </label>
  </div>
  <p v-if="errorMessage" class="error">{{ errorMessage }}</p>
</template>
