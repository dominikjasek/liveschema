<script setup lang="ts">
import type { Adoption } from '@/schemas'

defineProps<{ data: Adoption }>()
const emit = defineEmits<{ submit: []; back: [] }>()
</script>

<template>
  <div class="step">
    <h2>Step 4 — Review</h2>
    <dl class="review">
      <dt>Animal</dt>
      <dd>{{ data.animalType }}</dd>
      <dt>Living</dt>
      <dd>{{ data.living }}</dd>
      <dt>Name</dt>
      <dd>{{ data.details.name }}</dd>
      <dt>Age</dt>
      <dd>{{ data.details.age }}</dd>
      <template v-if="data.animalType === 'dog'">
        <dt>Size</dt>
        <dd>{{ data.details.size }}</dd>
        <dt>Good with kids</dt>
        <dd>{{ data.details.goodWithKids ? 'yes' : 'no' }}</dd>
      </template>
      <template v-else-if="data.animalType === 'cat'">
        <dt>Indoor</dt>
        <dd>{{ data.details.indoor ? 'yes' : 'no' }}</dd>
        <dt>Declawed</dt>
        <dd>{{ data.details.declawed ? 'yes' : 'no' }}</dd>
      </template>
      <template v-else-if="data.animalType === 'parrot'">
        <dt>Size</dt>
        <dd>{{ data.details.size }}</dd>
        <dt>Talks</dt>
        <dd>{{ data.details.talks ? 'yes' : 'no' }}</dd>
      </template>
    </dl>
    <div class="actions">
      <button type="button" @click="emit('back')">Back</button>
      <button type="button" @click="emit('submit')">Submit</button>
    </div>
  </div>
</template>
