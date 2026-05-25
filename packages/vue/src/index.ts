import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { declaredFields, enumOptions, type SchemaBuilder, type SchemaKeys } from '@liveschema/core'

/**
 * Per-field metadata exposed to Vue consumers. The field's key is the record
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
   * Computed ref of every declared field, keyed by field key. Insertion order
   * matches the declaration order in the schema, so iteration via
   * `Object.entries(fields.value)` preserves source order.
   */
  fields: ComputedRef<Record<SchemaKeys<F>, LiveSchemaField>>
  /**
   * Computed ref of the active subset. Inactive keys are absent from the
   * record (not present with `isActive: false`), so `Object.keys(activeFields.value)`
   * gives the live ordered list of active keys.
   */
  activeFields: ComputedRef<Partial<Record<SchemaKeys<F>, LiveSchemaField>>>
  /**
   * Reactive predicate — usable from templates without `.value`, and from
   * `<script setup>` without `.value` (reads the computed ref internally).
   */
  isActiveField: (key: SchemaKeys<F>) => boolean
}

/**
 * Vue composable that walks a liveschema definition against a reactive form
 * state and exposes the active-field set as two computed records plus a
 * predicate. Pair it with any reactive value source — vee-validate's
 * `useForm`, a `ref`, a `reactive`, or a getter:
 *
 *     const form = useForm({ validationSchema: toStandardSchema(schema) })
 *     const { isActiveField, fields } = useLiveSchema(schema, () => form.values)
 *
 *     <PaymentMethodRadios
 *       v-if="isActiveField('paymentMethod')"
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
  type Key = SchemaKeys<SchemaBuilder<V>>

  const declared = computed(() =>
    declaredFields(schema, (toValue(values) ?? {}) as Record<string, unknown>),
  )

  const fields = computed(() => {
    const out = {} as Record<Key, LiveSchemaField>
    for (const f of declared.value) {
      out[f.key as Key] = { isActive: f.isActive, enumOptions: enumOptions(f.schema) }
    }
    return out
  })

  const activeFields = computed(() => {
    const out = {} as Partial<Record<Key, LiveSchemaField>>
    for (const f of declared.value) {
      if (f.isActive) out[f.key as Key] = { isActive: true, enumOptions: enumOptions(f.schema) }
    }
    return out
  })

  const isActiveField = (key: Key) => key in activeFields.value

  return { fields, activeFields, isActiveField }
}
