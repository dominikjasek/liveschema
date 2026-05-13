import { listSteps as listStepsBase, schemaAtPath, type Step } from 'zod-form-flow'
import { adoptionSchema } from '@/schemas'

export type { Step }
export { schemaAtPath }

export function listSteps(values: unknown): Step[] {
  return listStepsBase(adoptionSchema, values)
}
