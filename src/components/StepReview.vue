<script setup lang="ts">
import type { Adoption } from '@/schemas'

defineProps<{ data: Adoption }>()
</script>

<template>
  <h2>Step 4 — Review</h2>
  <dl class="review">
    <dt>Animal</dt>
    <dd>{{ data.animalType }}</dd>
    <dt>House size</dt>
    <dd>{{ data.houseSize }}</dd>
    <template v-if="data.animalType === 'dog'">
      <dt>Size</dt>
      <dd>{{ data.details.dogSize }}</dd>
    </template>
    <template v-else-if="data.animalType === 'cat'">
      <dt>Sex</dt>
      <dd>{{ data.details.catSex }}</dd>
    </template>
    <template v-else-if="data.animalType === 'parrot'">
      <dt>Speech</dt>
      <dd>{{ data.details.parrotSpeech }}</dd>
    </template>
  </dl>
</template>
