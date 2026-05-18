import { z } from 'zod'
import { defineForm, type InferForm, type InferField, type FormKeys } from 'form-flow'

export const animals = ['dog', 'cat'] as const
export const dogSizes = ['small', 'large'] as const

export const form = defineForm()
  .ask('email', z.email())
  .ask('animal', z.enum(animals))
  .when({ animal: 'dog' }, (b) => b.ask('dogSize', z.enum(dogSizes)))
  .when({ animal: 'cat' }, (b) => b.ask('indoor', z.boolean()))

export type FormValues = InferForm<typeof form>
export type FieldKey = FormKeys<typeof form>

/**
 * TanStack Form needs one flat value shape, not a discriminated union.
 * Widen the branching `FormValues` into `{ email?, animal?, dogSize?, indoor? }`.
 */
export type FormFields = {
  [K in FieldKey]?: InferField<typeof form, K>
}
