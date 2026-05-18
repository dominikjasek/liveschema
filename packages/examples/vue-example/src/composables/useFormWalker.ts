import { activeFields, type FormField } from 'form-flow'
import { form } from '@/schemas'

export type { FormField }

export function listSteps(values: Record<string, unknown>): FormField[] {
  return activeFields(form, values)
}
