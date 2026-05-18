import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { FieldValues, Resolver } from 'react-hook-form'
import { toStandardSchema, type FormBuilder } from 'form-flow'

/**
 * Build a react-hook-form `Resolver` from a `form-flow` form definition.
 *
 * `toStandardSchema(form)` produces a Standard Schema whose `validate` is
 * re-evaluated on every cycle — it re-asks form-flow which fields are
 * reachable for the current values, then validates each one. We just hand
 * that schema to `@hookform/resolvers/standard-schema`.
 */
export function formFlowResolver<
  V extends object,
  TIn extends FieldValues = Partial<V> & FieldValues,
>(form: FormBuilder<V>): Resolver<TIn, unknown, V> {
  return standardSchemaResolver<TIn, unknown, V>(toStandardSchema<V, TIn>(form))
}
