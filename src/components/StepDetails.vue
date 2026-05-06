<script setup lang="ts">
import { computed } from 'vue'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import {
  detailsSchemaFor,
  sizes,
  type AnimalType,
  type DetailsByType,
  type LivingSituation,
} from '../schemas'

type AnyDetails = DetailsByType[AnimalType]

type FormShape = {
  name?: string
  age?: number
  size?: 'small' | 'medium' | 'large'
  indoor?: boolean
  declawed?: boolean
  goodWithKids?: boolean
  talks?: boolean
}

const props = defineProps<{
  animalType: AnimalType
  living: LivingSituation | undefined
  initial?: Partial<AnyDetails>
}>()

const emit = defineEmits<{
  next: [details: AnyDetails]
  back: []
}>()

const schema = computed(() => toTypedSchema(detailsSchemaFor(props.animalType, props.living)))

const { defineField, handleSubmit, errors } = useForm<FormShape>({
  validationSchema: schema as never,
  initialValues: (props.initial ?? {}) as FormShape,
})

const [name] = defineField('name')
const [age] = defineField('age')
const [size] = defineField('size')
const [indoor] = defineField('indoor')
const [declawed] = defineField('declawed')
const [goodWithKids] = defineField('goodWithKids')
const [talks] = defineField('talks')

const onSubmit = handleSubmit((v) => {
  // Schema is the source of truth — parse to get a properly-typed payload.
  const parsed = detailsSchemaFor(props.animalType, props.living).parse(v)
  emit('next', parsed as AnyDetails)
})

const apartmentRestricted = computed(() => props.living === 'apartment')

const err = (key: string) => (errors.value as Record<string, string | undefined>)[key]
</script>

<template>
  <form @submit.prevent="onSubmit" class="step">
    <h2>Step 2 — {{ animalType }} details</h2>
    <p v-if="!living" class="hint">
      Tip: living situation hasn't been chosen yet. We'll re-check these answers after step 3.
    </p>
    <p v-else-if="apartmentRestricted" class="hint">
      Apartment selected — some options are restricted.
    </p>

    <label class="field">
      <span>Name</span>
      <input v-model="name" type="text" />
      <em v-if="err('name')" class="error">{{ err('name') }}</em>
    </label>

    <label class="field">
      <span>Age (years)</span>
      <input v-model.number="age" type="number" min="0" max="50" />
      <em v-if="err('age')" class="error">{{ err('age') }}</em>
    </label>

    <template v-if="animalType === 'dog'">
      <label class="field">
        <span>Size</span>
        <select v-model="size">
          <option disabled :value="undefined">Select…</option>
          <option v-for="s in sizes" :key="s" :value="s">{{ s }}</option>
        </select>
        <em v-if="err('size')" class="error">{{ err('size') }}</em>
      </label>
      <label class="checkbox">
        <input v-model="goodWithKids" type="checkbox" />
        <span>Good with kids</span>
      </label>
    </template>

    <template v-else-if="animalType === 'cat'">
      <label class="checkbox">
        <input v-model="indoor" type="checkbox" />
        <span>Indoor only</span>
      </label>
      <em v-if="err('indoor')" class="error">{{ err('indoor') }}</em>
      <label class="checkbox">
        <input v-model="declawed" type="checkbox" />
        <span>Declawed</span>
      </label>
    </template>

    <template v-else-if="animalType === 'parrot'">
      <label class="field">
        <span>Size</span>
        <select v-model="size">
          <option disabled :value="undefined">Select…</option>
          <option v-for="s in sizes" :key="s" :value="s">{{ s }}</option>
        </select>
        <em v-if="err('size')" class="error">{{ err('size') }}</em>
      </label>
      <label class="checkbox">
        <input v-model="talks" type="checkbox" />
        <span>Talks</span>
      </label>
    </template>

    <div class="actions">
      <button type="button" @click="emit('back')">Back</button>
      <button type="submit">Next</button>
    </div>
  </form>
</template>
