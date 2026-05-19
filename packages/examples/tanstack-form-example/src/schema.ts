import { z } from 'zod'
import { defineForm, type InferForm, type FormKeys } from 'form-flow'

export const animals = ['dog', 'cat'] as const
export const dogSizes = ['small', 'medium', 'large'] as const
export const apartmentDogSizes = ['small', 'medium'] as const
export const housingTypes = ['house', 'apartment'] as const

export const form = defineForm()
  .ask('email', z.email())
  .ask('fullName', z.string().min(2).max(100))
  .ask('housingType', z.enum(housingTypes))
  .when({ housingType: 'house' }, (b) => b.ask('hasYard', z.boolean()))
  .ask('hasPriorPetExperience', z.boolean())
  .when({ hasPriorPetExperience: true }, (b) => b.ask('priorPetName', z.string().min(1).max(100)))
  .ask('animal', z.enum(animals))
  // Apartment dwellers can't adopt large dogs — restrict the dogSize enum to
  // small/medium for that branch. The two `.when` patterns are mutually
  // exclusive (housingType is either 'house' or 'apartment'), so dogSize is
  // declared exactly once at runtime.
  .when({ animal: 'dog' }, (b) =>
    b
      .when({ housingType: 'house' }, (b) => b.ask('dogSize', z.enum(dogSizes)))
      .when({ housingType: 'apartment' }, (b) => b.ask('dogSize', z.enum(apartmentDogSizes))),
  )
  .when({ animal: 'dog' }, (b) => b.ask('dogName', z.string().min(2).max(100)))
  .when({ animal: 'cat' }, (b) => b.ask('catIndoor', z.boolean()))
  .whenAny([{ housingType: 'apartment' }, { animal: 'dog' }], (b) =>
    b.ask('needsHomeVisit', z.boolean().optional()),
  )

export type FormValues = InferForm<typeof form>
export type FieldKey = FormKeys<typeof form>
