import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
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
   * Computed ref of every declared field, keyed by field key. Each entry's
   * shape is derived from that key's inferred value type: enum-like fields
   * carry `enumOptions?`, others don't have the property at all.
   */
  fields: ComputedRef<FieldsRecord<F>>
  /**
   * Computed ref of the reachable subset. Unreachable keys are absent from the
   * record, so `Object.keys(reachableFields.value)` gives the live ordered list.
   */
  reachableFields: ComputedRef<Partial<FieldsRecord<F>>>
  /**
   * Reactive predicate — usable from templates without `.value`, and from
   * `<script setup>` without `.value` (reads the computed ref internally).
   */
  isReachableField: (key: SchemaKeys<F>) => boolean
}

/**
 * Vue composable that walks a liveschema definition against a reactive form
 * state and exposes the reachable-field set as two computed records plus a
 * predicate. Pair it with any reactive value source — vee-validate's
 * `useForm`, a `ref`, a `reactive`, or a getter:
 *
 *     const form = useForm({ validationSchema: toStandardSchema(schema) })
 *     const { isReachableField, fields } = useLiveSchema(schema, () => form.values)
 *
 *     <PaymentMethodRadios
 *       v-if="isReachableField('paymentMethod')"
 *       :options="fields.paymentMethod.enumOptions ?? []"
 *     />
 *
 * The `values` argument accepts a ref, a computed, a getter, or a plain object
 * — `toValue` unwraps each on every recomputation.
 */
export function useLiveSchema<V extends object>(
  schema: SchemaBuilder<V>,
  values: MaybeRefOrGetter<Partial<V> | Record<string, unknown> | undefined>,
): UseLiveSchemaResult<SchemaBuilder<V>> {
  type Result = UseLiveSchemaResult<SchemaBuilder<V>>

  const declared = computed(() =>
    declaredFields(schema, (toValue(values) ?? {}) as Record<string, unknown>),
  )

  const fields = computed(() => {
    const out: Record<string, LiveSchemaField> = {}
    for (const f of declared.value) {
      const opts = enumOptions(f.schema)
      out[f.key] =
        opts !== undefined
          ? { isReachable: f.isReachable, enumOptions: opts }
          : { isReachable: f.isReachable }
    }
    return out as Result['fields']['value']
  })

  const reachableFields = computed(() => {
    const out: Record<string, LiveSchemaField> = {}
    for (const f of declared.value) {
      if (!f.isReachable) continue
      const opts = enumOptions(f.schema)
      out[f.key] =
        opts !== undefined ? { isReachable: true, enumOptions: opts } : { isReachable: true }
    }
    return out as Result['reachableFields']['value']
  })

  const isReachableField = (key: SchemaKeys<SchemaBuilder<V>>) => key in reachableFields.value

  return { fields, reachableFields, isReachableField }
}
