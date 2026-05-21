import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { FieldValues, Resolver } from 'react-hook-form'
import { toStandardSchema, type SchemaBuilder } from 'liveschema'

/**
 * Build a react-hook-form `Resolver` from a `liveschema` schema.
 *
 * `toStandardSchema(schema)` produces a Standard Schema whose `validate` is
 * re-evaluated on every cycle — it re-asks liveschema which fields are
 * reachable for the current values, then validates each one. We just hand
 * that schema to `@hookform/resolvers/standard-schema`.
 */
export function liveschemaResolver<
  V extends object,
  TIn extends FieldValues = Partial<V> & FieldValues,
>(schema: SchemaBuilder<V>): Resolver<TIn, unknown, V> {
  return standardSchemaResolver<TIn, unknown, V>(toStandardSchema<V, TIn>(schema))
}
