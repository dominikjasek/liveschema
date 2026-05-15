<script setup lang="ts">
import { useField } from 'vee-validate'

const props = defineProps<{ path: string }>()

const { value: name, errorMessage: nameError } = useField<string>(
  () => `${props.path}.name`,
)
const { value: email, errorMessage: emailError } = useField<string>(
  () => `${props.path}.email`,
)
</script>

<template>
  <div>
    <h2>About you</h2>
    <label class="field">
      <span>Name</span>
      <input v-model="name" class="text-input" type="text" />
      <p v-if="nameError" class="error">{{ nameError }}</p>
    </label>
    <label class="field">
      <span>Email</span>
      <input v-model="email" class="text-input" type="email" />
      <p v-if="emailError" class="error">{{ emailError }}</p>
    </label>
  </div>
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
