import { z } from 'zod'

export const animalTypes = ['dog', 'cat', 'parrot'] as const
export const dogSizes = ['large', 'small'] as const
export const catSexes = ['male', 'female'] as const
export const parrotSpeechOptions = ['speaks', 'silent'] as const
export const houseSizes = ['small', 'medium', 'large'] as const

export type AnimalType = (typeof animalTypes)[number]
export type DogSize = (typeof dogSizes)[number]
export type CatSex = (typeof catSexes)[number]
export type ParrotSpeech = (typeof parrotSpeechOptions)[number]
export type HouseSize = (typeof houseSizes)[number]

export const step1Schema = z.object({
  animalType: z.enum(animalTypes, { message: 'Pick an animal' }),
})

export const dogDetailsSchema = z.object({
  dogSize: z.enum(dogSizes, { message: 'Pick a size' }),
})

export const catDetailsSchema = z.object({
  catSex: z.enum(catSexes, { message: 'Pick a sex' }),
})

export const parrotDetailsSchema = z.object({
  parrotSpeech: z.enum(parrotSpeechOptions, { message: 'Pick speaking ability' }),
})

export const dogStep2Schema = z.object({ details: dogDetailsSchema })
export const catStep2Schema = z.object({ details: catDetailsSchema })
export const parrotStep2Schema = z.object({ details: parrotDetailsSchema })

export const step3Schema = z.object({
  houseSize: z.enum(houseSizes, { message: 'Pick a house size' }),
})

export type DogDetails = z.infer<typeof dogDetailsSchema>
export type CatDetails = z.infer<typeof catDetailsSchema>
export type ParrotDetails = z.infer<typeof parrotDetailsSchema>

export type DetailsByType = {
  dog: DogDetails
  cat: CatDetails
  parrot: ParrotDetails
}

type Step2SchemaByType = {
  dog: typeof dogStep2Schema
  cat: typeof catStep2Schema
  parrot: typeof parrotStep2Schema
}

const step2SchemasByType: Step2SchemaByType = {
  dog: dogStep2Schema,
  cat: catStep2Schema,
  parrot: parrotStep2Schema,
}

export function step2SchemaFor<T extends AnimalType>(type: T): Step2SchemaByType[T] {
  return step2SchemasByType[type]
}

export const adoptionSchema = z
  .discriminatedUnion('animalType', [
    z.object({ animalType: z.literal('dog'), details: dogDetailsSchema }),
    z.object({ animalType: z.literal('cat'), details: catDetailsSchema }),
    z.object({ animalType: z.literal('parrot'), details: parrotDetailsSchema }),
  ])
  .and(step3Schema)

export type Adoption = z.infer<typeof adoptionSchema>
