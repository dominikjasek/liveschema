<script setup lang="ts">
import { catSexes, dogSizes, parrotSpeechOptions } from '@/schemas'
import { useTypedField, useTypedFormValues } from '@/composables/useTypedForm'

const formValues = useTypedFormValues()

const { value: dogSize, errorMessage: dogErr } = useTypedField('details.dogSize')
const { value: catSex, errorMessage: catErr } = useTypedField('details.catSex')
const { value: parrotSpeech, errorMessage: parrotErr } = useTypedField('details.parrotSpeech')
</script>

<template>
  <template v-if="formValues.animalType === 'dog'">
    <h2>Step 2 — Dog details</h2>
    <p>Do you want a large or small dog?</p>
    <div class="options">
      <label v-for="s in dogSizes" :key="s" class="radio">
        <input type="radio" :value="s" v-model="dogSize" />
        <span>{{ s }}</span>
      </label>
    </div>
    <p v-if="dogErr" class="error">{{ dogErr }}</p>
  </template>

  <template v-else-if="formValues.animalType === 'cat'">
    <h2>Step 2 — Cat details</h2>
    <p>Do you want a male or female cat?</p>
    <div class="options">
      <label v-for="s in catSexes" :key="s" class="radio">
        <input type="radio" :value="s" v-model="catSex" />
        <span>{{ s }}</span>
      </label>
    </div>
    <p v-if="catErr" class="error">{{ catErr }}</p>
  </template>

  <template v-else-if="formValues.animalType === 'parrot'">
    <h2>Step 2 — Parrot details</h2>
    <p>Do you want a parrot that speaks or one that doesn't?</p>
    <div class="options">
      <label v-for="s in parrotSpeechOptions" :key="s" class="radio">
        <input type="radio" :value="s" v-model="parrotSpeech" />
        <span>{{ s }}</span>
      </label>
    </div>
    <p v-if="parrotErr" class="error">{{ parrotErr }}</p>
  </template>
</template>
