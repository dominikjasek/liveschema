import { z } from 'zod'
import { defineForm, type InferForm } from 'zod-form-flow'

export const animals = ['dog', 'cat'] as const
export const dogSizes = ['small', 'large'] as const

export const form = defineForm()
  .ask('name', z.string().min(1))
  .ask('animal', z.enum(animals))
  .when({ animal: 'dog' }, (b) => b.ask('dogSize', z.enum(dogSizes)))
  .when({ animal: 'cat' }, (b) => b.ask('indoor', z.boolean()))

export type FormValues = InferForm<typeof form>
