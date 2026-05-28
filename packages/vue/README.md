# @liveschema/vue

Vue 3 bindings for [`@liveschema/core`](../core).

## Install

```sh
pnpm add @liveschema/core @liveschema/vue zod
```

## Usage

`useLiveSchema(schema, values)` is a composable. `values` accepts a `ref`, a `computed`, a getter, or a plain object — `toValue` unwraps each on every recomputation.

```vue
<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toStandardSchema } from '@liveschema/core'
import { useLiveSchema } from '@liveschema/vue'
import { schema } from './schema'

const form = useForm({ validationSchema: toStandardSchema(schema) })

const { fields, activeFields, isActiveField } = useLiveSchema(schema, () => form.values)
</script>

<template>
  <!-- Predicate works in templates because it reads .value internally. -->
  <PaymentRadios
    v-if="isActiveField('paymentMethod')"
    :options="fields.paymentMethod.enumOptions ?? []"
  />

  <!-- Iterate the active subset in source order. -->
  <Field
    v-for="(info, key) in activeFields"
    :key="key"
    :name="key"
    :options="info?.enumOptions ?? []"
  />
</template>
```

### Return shape

| Property        | Type                                                                                        | Meaning                                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `fields`        | `ComputedRef<Record<Key, { isActive: boolean; enumOptions?: readonly string[] }>>`          | Computed ref of every declared field, keyed by field key. Insertion order matches the schema's declaration order.                  |
| `activeFields`  | `ComputedRef<Partial<Record<Key, { isActive: boolean; enumOptions?: readonly string[] }>>>` | Computed ref of the active subset; inactive keys are absent. `Object.keys(activeFields.value)` gives the live ordered list.        |
| `isActiveField` | `(key: Key) => boolean`                                                                     | Plain function that reads the current `activeFields.value` — usable from templates without `.value` and from `<script setup>` too. |

Keys are typed using `SchemaKeys<typeof schema>` from `@liveschema/core`, so `isActiveField('typo')` is a compile-time error.

## Examples

- [examples/vue-example](../../examples/vue-example) — Vue 3 + vee-validate (multi-step wizard) [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/fork/github/dominikjasek/liveschema/tree/master/examples/vue-example)
