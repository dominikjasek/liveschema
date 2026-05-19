import { z } from 'zod'
import { defineForm, type InferForm, type FormKeys } from 'form-flow'

export const animals = ['dog', 'cat'] as const
export const dogSizes = ['small', 'large'] as const

export const form = defineForm()
  .ask('email', z.email())
  .ask('havePets', z.boolean())
  .ask('animal', z.enum(animals))
  .when({ animal: 'dog' }, (b) => b.ask('dogSize', z.enum(dogSizes)))
  .when({ animal: 'cat' }, (b) => b.ask('indoor', z.boolean()))
  .when({ animal: 'dog', havePets: true }, (b) =>
    b.ask('nameOfYourDog', z.string().min(2).max(100)),
  )
  .whenAny([{ animal: 'dog' }, { havePets: true }], (b) => b.ask('vipDogQuestion', z.boolean()))

export type FormValues = InferForm<typeof form>
export type FieldKey = FormKeys<typeof form>
