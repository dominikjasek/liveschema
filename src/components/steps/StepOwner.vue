<script setup lang="ts">
import { useField } from 'vee-validate'
import type { FieldValue } from '@/schemas'

type Owner = FieldValue<'owner'>

const props = defineProps<{ path: string }>()

const { value: name, errorMessage: nameErr } = useField<Owner['ownerName']>(
  () => `${props.path}.ownerName`,
)
const { value: email, errorMessage: emailErr } = useField<Owner['ownerEmail']>(
  () => `${props.path}.ownerEmail`,
)
</script>

<template>
  <h2>Owner info</h2>

  <label class="field">
    <span>Name</span>
    <input class="text-input" type="text" v-model="name" />
  </label>
  <p v-if="nameErr" class="error">{{ nameErr }}</p>

  <label class="field">
    <span>Email</span>
    <input class="text-input" type="email" v-model="email" />
  </label>
  <p v-if="emailErr" class="error">{{ emailErr }}</p>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-top: 0.75rem;
}
.text-input {
  padding: 0.4rem 0.6rem;
  font-size: 1rem;
  background: #1f1f1f;
  border: 1px solid #333;
  border-radius: 4px;
  color: white;
  width: 18rem;
}
</style>
