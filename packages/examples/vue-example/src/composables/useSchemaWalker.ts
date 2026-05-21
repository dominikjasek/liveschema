import { activeFields, type SchemaField } from 'liveschema'
import { form } from '@/schemas'

export type { SchemaField }

export function listSteps(values: Record<string, unknown>): SchemaField[] {
  return activeFields(form, values)
}
