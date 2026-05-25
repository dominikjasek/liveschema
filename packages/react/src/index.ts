import { useMemo } from 'react'
import { declaredFields, enumOptions, type SchemaBuilder, type SchemaKeys } from '@liveschema/core'

/**
 * Per-field metadata exposed to React consumers. The field's key is the record
 * key (no `key` property on the value); `enumOptions` is populated only for
 * leaves whose validator exposes string enum options (Zod `z.enum(...)`,
 * Valibot, etc.) and `undefined` otherwise.
 */
export type LiveSchemaField = {
  isActive: boolean
  enumOptions: readonly string[] | undefined
}

export type UseLiveSchemaResult<F> = {
  /**
   * Every field declared in the schema, keyed by field key. Insertion order
   * matches the declaration order in the schema, so iteration via
   * `Object.entries(fields)` preserves source order.
   */
  fields: Record<SchemaKeys<F>, LiveSchemaField>
  /**
   * The subset of `fields` whose branch path is currently reachable. Inactive
   * keys are absent from the record (not present with `isActive: false`), so
   * `Object.keys(activeFields)` gives the live ordered list of active keys.
   */
  activeFields: Partial<Record<SchemaKeys<F>, LiveSchemaField>>
  /** Convenience predicate — equivalent to `key in activeFields`. */
  isActiveField: (key: SchemaKeys<F>) => boolean
}

/**
 * React hook that walks a liveschema definition against the current form values
 * and exposes the active-field set as two records plus a predicate. Drop it
 * next to any form state source — `useWatch` from react-hook-form, `useStore`
 * from TanStack Form, plain `useState`, etc. — and gate JSX with the predicate:
 *
 *     const values = useWatch({ control })
 *     const { isActiveField, fields } = useLiveSchema(schema, values)
 *
 *     {isActiveField('paymentMethod') && (
 *       <PaymentMethodRadios options={fields.paymentMethod.enumOptions ?? []} />
 *     )}
 */
export function useLiveSchema<V extends object>(
  schema: SchemaBuilder<V>,
  values: Partial<V> | Record<string, unknown> | undefined,
): UseLiveSchemaResult<SchemaBuilder<V>> {
  return useMemo(() => {
    type Key = SchemaKeys<SchemaBuilder<V>>
    const declared = declaredFields(schema, (values ?? {}) as Record<string, unknown>)
    const fields = {} as Record<Key, LiveSchemaField>
    const activeFields = {} as Partial<Record<Key, LiveSchemaField>>
    for (const f of declared) {
      const info: LiveSchemaField = { isActive: f.isActive, enumOptions: enumOptions(f.schema) }
      fields[f.key as Key] = info
      if (f.isActive) activeFields[f.key as Key] = info
    }
    const isActiveField = (key: Key) => key in activeFields
    return { fields, activeFields, isActiveField }
  }, [schema, values])
}
