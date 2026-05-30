import { useMemo } from 'react'
import {
  declaredFields,
  enumOptions,
  type InferField,
  type SchemaBuilder,
  type SchemaKeys,
} from '@liveschema/core'

/**
 * Pull the string-literal members out of T if T is a (multi-)literal string
 * union — `'a' | 'b'`, `'a' | 'b' | undefined`. Wide `string`, booleans,
 * numbers, plain objects, etc. all collapse to `never`. Used to decide whether
 * a field gets an `enumOptions` property on its record entry.
 */
type EnumOptionsFor<T> = [Extract<T, string>] extends [never]
  ? never
  : string extends Extract<T, string>
    ? never
    : Extract<T, string>

/**
 * Per-key record entry shape. Non-enum-like fields get `{ isReachable }` only —
 * `fields.someBoolean.enumOptions` is a compile error rather than `undefined`.
 * Enum-like fields get `enumOptions?` typed to that field's literal union.
 *
 * `enumOptions` stays optional even when statically detected so that edge
 * cases that look enum-like to TS but don't expose `.options` at runtime
 * (e.g. a Standard Schema vendor that doesn't follow the Zod convention)
 * still surface as `undefined` instead of producing a runtime mismatch.
 */
export type LiveSchemaFieldFor<T> = [EnumOptionsFor<T>] extends [never]
  ? { isReachable: boolean }
  : { isReachable: boolean; enumOptions?: readonly EnumOptionsFor<T>[] }

/**
 * Open-ended supertype for code that needs a single shape to accept any field
 * (e.g. a renderer that takes an arbitrary entry without caring which key).
 * Both `LiveSchemaFieldFor<T>` branches are assignable to this.
 */
export type LiveSchemaField = {
  isReachable: boolean
  enumOptions?: readonly string[]
}

type FieldsRecord<F> = { [K in SchemaKeys<F>]: LiveSchemaFieldFor<InferField<F, K>> }

export type UseLiveSchemaResult<F> = {
  /**
   * Every field declared in the schema, keyed by field key. Each entry's
   * shape is derived from that key's inferred value type: enum-like fields
   * carry `enumOptions?`, others don't have the property at all.
   */
  fields: FieldsRecord<F>
  /**
   * The subset of `fields` whose branch path is currently reachable. Unreachable
   * keys are absent from the record, so `Object.keys(reachableFields)` gives the
   * live ordered list of reachable keys.
   */
  reachableFields: Partial<FieldsRecord<F>>
  /** Convenience predicate — equivalent to `key in reachableFields`. */
  isReachableField: (key: SchemaKeys<F>) => boolean
}

/**
 * React hook that walks a liveschema definition against the current form
 * values and exposes the reachable-field set as two records plus a predicate.
 * Drop it next to any form state source — `useWatch` from react-hook-form,
 * `useStore` from TanStack Form, plain `useState`, etc. — and gate JSX with
 * the predicate:
 *
 *     const values = useWatch({ control })
 *     const { isReachableField, fields } = useLiveSchema(schema, values)
 *
 *     {isReachableField('paymentMethod') && (
 *       <PaymentMethodRadios options={fields.paymentMethod.enumOptions ?? []} />
 *     )}
 */
export function useLiveSchema<V extends object>(
  schema: SchemaBuilder<V>,
  values: Partial<V> | Record<string, unknown> | undefined,
): UseLiveSchemaResult<SchemaBuilder<V>> {
  return useMemo(() => {
    const declared = declaredFields(schema, (values ?? {}) as Record<string, unknown>)
    const fields: Record<string, LiveSchemaField> = {}
    const reachableFields: Record<string, LiveSchemaField> = {}
    for (const f of declared) {
      const opts = enumOptions(f.schema)
      const info: LiveSchemaField =
        opts !== undefined
          ? { isReachable: f.isReachable, enumOptions: opts }
          : { isReachable: f.isReachable }
      fields[f.key] = info
      if (f.isReachable) reachableFields[f.key] = info
    }
    type Result = UseLiveSchemaResult<SchemaBuilder<V>>
    const isReachableField = (key: SchemaKeys<SchemaBuilder<V>>) => key in reachableFields
    return {
      fields: fields as Result['fields'],
      reachableFields: reachableFields as Result['reachableFields'],
      isReachableField,
    }
  }, [schema, values])
}
