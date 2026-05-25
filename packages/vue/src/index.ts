import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { declaredFields, enumOptions, type SchemaBuilder, type SchemaKeys } from 'liveschema'

/**
 * A field of the schema as exposed to Vue consumers. `enumOptions` is populated
 * only for leaves whose validator exposes string enum options (Zod `z.enum(...)`,
 * Valibot, etc.); `undefined` otherwise.
 */
export type LiveSchemaField<K extends string = string> = {
  key: K
  isActive: boolean
  enumOptions: readonly string[] | undefined
}

export type UseLiveSchemaResult<F> = {
  /** Computed ref of ordered keys whose branch path matches the current values. */
  activeFieldKeys: ComputedRef<Array<SchemaKeys<F>>>
  /** Computed ref of every field declared in the schema; `isActive` flags reachability. */
  fields: ComputedRef<Array<LiveSchemaField<SchemaKeys<F>>>>
  /** Reactive predicate equivalent to `activeFieldKeys.value.includes(key)`. */
  isActiveField: (key: SchemaKeys<F>) => boolean
}

/**
 * Vue composable that walks a liveschema definition against a reactive form state
 * and returns the active-field set in three forms (ordered keys, full field list
 * with `isActive` flags, predicate function). Pair it with any reactive value
 * source — vee-validate's `useForm`, a `ref`, a `reactive`, or a getter:
 *
 *     const form = useForm({ validationSchema: toStandardSchema(schema) })
 *     const { isActiveField, fields } = useLiveSchema(schema, () => form.values)
 *
 *     <PaymentMethodRadios v-if="isActiveField('paymentMethod')" />
 *
 * The `values` argument accepts a ref, a computed, a getter, or a plain object —
 * `toValue` unwraps each on every recomputation.
 */
export function useLiveSchema<V extends object>(
  schema: SchemaBuilder<V>,
  values: MaybeRefOrGetter<Partial<V> | Record<string, unknown> | undefined>,
): UseLiveSchemaResult<SchemaBuilder<V>> {
  type Key = SchemaKeys<SchemaBuilder<V>>

  const declared = computed(() =>
    declaredFields(schema, (toValue(values) ?? {}) as Record<string, unknown>),
  )

  const fields = computed(
    () =>
      declared.value.map((f) => ({
        key: f.key,
        isActive: f.isActive,
        enumOptions: enumOptions(f.schema),
      })) as Array<LiveSchemaField<Key>>,
  )

  const activeFieldKeys = computed(
    () => declared.value.filter((f) => f.isActive).map((f) => f.key) as Array<Key>,
  )

  const isActiveField = (key: Key) => activeFieldKeys.value.includes(key)

  return { activeFieldKeys, fields, isActiveField }
}
