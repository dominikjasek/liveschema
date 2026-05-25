import { useMemo } from 'react'
import { declaredFields, enumOptions, type SchemaBuilder, type SchemaKeys } from '@liveschema/core'

/**
 * A field of the schema as exposed to React consumers. `enumOptions` is populated
 * only for leaves whose validator exposes string enum options (Zod `z.enum(...)`,
 * Valibot, etc.); `undefined` otherwise.
 */
export type LiveSchemaField<K extends string = string> = {
  key: K
  isActive: boolean
  enumOptions: readonly string[] | undefined
}

export type UseLiveSchemaResult<F> = {
  /** Ordered keys of fields whose branch path matches the current values. */
  activeFieldKeys: Array<SchemaKeys<F>>
  /** Every field declared in the schema; `isActive` flags reachability. */
  fields: Array<LiveSchemaField<SchemaKeys<F>>>
  /** Convenience predicate equivalent to `activeFieldKeys.includes(key)`. */
  isActiveField: (key: SchemaKeys<F>) => boolean
}

/**
 * React hook that walks a liveschema definition against the current form values
 * and returns the active-field set in three forms (ordered keys, full field list
 * with `isActive` flags, predicate function). Drop it next to any form state
 * source — `useWatch` from react-hook-form, `useStore` from TanStack Form,
 * `useState`, etc. — and use the predicate to gate JSX:
 *
 *     const values = useWatch({ control })
 *     const { isActiveField, fields } = useLiveSchema(schema, values)
 *
 *     {isActiveField('paymentMethod') && <PaymentMethodRadios ... />}
 */
export function useLiveSchema<V extends object>(
  schema: SchemaBuilder<V>,
  values: Partial<V> | Record<string, unknown> | undefined,
): UseLiveSchemaResult<SchemaBuilder<V>> {
  return useMemo(() => {
    const declared = declaredFields(schema, (values ?? {}) as Record<string, unknown>)
    const fields = declared.map((f) => ({
      key: f.key,
      isActive: f.isActive,
      enumOptions: enumOptions(f.schema),
    })) as Array<LiveSchemaField<SchemaKeys<SchemaBuilder<V>>>>
    const activeFieldKeys = declared.filter((f) => f.isActive).map((f) => f.key) as Array<
      SchemaKeys<SchemaBuilder<V>>
    >
    const activeSet = new Set<string>(activeFieldKeys)
    const isActiveField = (key: SchemaKeys<SchemaBuilder<V>>) => activeSet.has(key as string)
    return { activeFieldKeys, fields, isActiveField }
  }, [schema, values])
}
