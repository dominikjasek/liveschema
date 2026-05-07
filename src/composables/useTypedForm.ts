import { useField, useFormValues } from 'vee-validate'
import type {
  AnimalType,
  CatDetails,
  DogDetails,
  HouseSize,
  ParrotDetails,
} from '@/schemas'

type DraftDetails = Partial<DogDetails & CatDetails & ParrotDetails>

export type FormShape = {
  animalType?: AnimalType // step 1
  details?: DraftDetails // step 2
  houseSize?: HouseSize // step 3
}

type Path<T, Prefix extends string = ''> = {
  [K in keyof T & string]: NonNullable<T[K]> extends object
    ? `${Prefix}${K}` | Path<NonNullable<T[K]>, `${Prefix}${K}.`>
    : `${Prefix}${K}`
}[keyof T & string]

type ValueAt<T, P extends string> = P extends `${infer Head}.${infer Tail}`
  ? Head extends keyof T
    ? ValueAt<NonNullable<T[Head]>, Tail>
    : never
  : P extends keyof T
    ? T[P]
    : never

export type FormPath = Path<FormShape>

export function useTypedField<P extends FormPath>(path: P) {
  return useField<ValueAt<FormShape, P>>(path)
}

export function useTypedFormValues() {
  return useFormValues<FormShape>()
}
