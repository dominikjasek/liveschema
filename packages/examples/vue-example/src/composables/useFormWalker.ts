import { listFormSteps, type FormStep } from 'form-flow'
import { form } from '@/schemas'

export type { FormStep }

export function listSteps(values: Record<string, unknown>): FormStep[] {
  return listFormSteps(form, values)
}
