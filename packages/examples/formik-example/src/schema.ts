import { type } from 'arktype'
import { defineForm, type InferForm } from 'form-flow'

export const animals = ['dog', 'cat'] as const
export const dogSizes = ['small', 'large'] as const

export const form = defineForm()
  .ask('email', type('string.email'))
  .ask('animal', type('"dog" | "cat"'))
  .when({ animal: 'dog' }, (b) => b.ask('dogSize', type('"small" | "large"')))
  .when({ animal: 'cat' }, (b) => b.ask('indoor', type('boolean')))

export type FormValues = InferForm<typeof form>
