import { z } from 'zod'

export const animalTypes = ['dog', 'cat', 'parrot'] as const
export const livingSituations = ['house', 'apartment', 'farm'] as const
export const sizes = ['small', 'medium', 'large'] as const

export type AnimalType = (typeof animalTypes)[number]
export type LivingSituation = (typeof livingSituations)[number]
export type Size = (typeof sizes)[number]

export const step1Schema = z.object({
  animalType: z.enum(animalTypes, { message: 'Pick an animal' }),
})

export const step3Schema = z.object({
  living: z.enum(livingSituations, { message: 'Pick a living situation' }),
})

const baseDetails = {
  name: z.string().min(1, 'Name is required').max(40),
  age: z
    .number({ message: 'Age is required' })
    .int('Whole years only')
    .min(0)
    .max(50),
}

const apartmentMaxSize: Size = 'medium'
const sizeIndex = (s: Size) => sizes.indexOf(s)

function sizeAllowed(size: Size, living: LivingSituation | undefined): boolean {
  if (living === 'apartment') return sizeIndex(size) <= sizeIndex(apartmentMaxSize)
  return true
}

export const dogDetailsSchema = (living: LivingSituation | undefined) =>
  z.object({
    ...baseDetails,
    size: z
      .enum(sizes, { message: 'Pick a size' })
      .refine((s) => sizeAllowed(s, living), {
        message: `A large dog won't fit in an apartment`,
      }),
    goodWithKids: z.boolean(),
  })

export const catDetailsSchema = (living: LivingSituation | undefined) =>
  z.object({
    ...baseDetails,
    indoor:
      living === 'apartment'
        ? z.literal(true, { message: 'Apartment cats must be indoor' })
        : z.boolean(),
    declawed: z.boolean(),
  })

export const parrotDetailsSchema = (living: LivingSituation | undefined) =>
  z.object({
    ...baseDetails,
    size: z
      .enum(sizes, { message: 'Pick a size' })
      .refine((s) => sizeAllowed(s, living), {
        message: `A large parrot needs more space than an apartment`,
      }),
    talks: z.boolean(),
  })

export type DogDetails = z.infer<ReturnType<typeof dogDetailsSchema>>
export type CatDetails = z.infer<ReturnType<typeof catDetailsSchema>>
export type ParrotDetails = z.infer<ReturnType<typeof parrotDetailsSchema>>

export type DetailsByType = {
  dog: DogDetails
  cat: CatDetails
  parrot: ParrotDetails
}

export function detailsSchemaFor<T extends AnimalType>(
  type: T,
  living: LivingSituation | undefined,
) {
  if (type === 'dog') return dogDetailsSchema(living) as unknown as z.ZodType<DetailsByType[T]>
  if (type === 'cat') return catDetailsSchema(living) as unknown as z.ZodType<DetailsByType[T]>
  return parrotDetailsSchema(living) as unknown as z.ZodType<DetailsByType[T]>
}

export type Adoption =
  | { animalType: 'dog'; living: LivingSituation; details: DogDetails }
  | { animalType: 'cat'; living: LivingSituation; details: CatDetails }
  | { animalType: 'parrot'; living: LivingSituation; details: ParrotDetails }
