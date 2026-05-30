# @liveschema/vue

Vue 3 bindings for [`@liveschema/core`](https://www.npmjs.com/package/@liveschema/core).

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

const { fields, reachableFields, isReachableField } = useLiveSchema(schema, () => form.values)
</script>

<template>
  <!-- Predicate works in templates because it reads .value internally. -->
  <PaymentRadios
    v-if="isReachableField('paymentMethod')"
    :options="fields.paymentMethod.enumOptions ?? []"
  />

  <!-- Iterate the reachable subset in source order. -->
  <Field
    v-for="(info, key) in reachableFields"
    :key="key"
    :name="key"
    :options="info?.enumOptions ?? []"
  />
</template>
```

### Return shape

| Property           | Type                                                                                           | Meaning                                                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `fields`           | `ComputedRef<Record<Key, { isReachable: boolean; enumOptions?: readonly string[] }>>`          | Computed ref of every declared field, keyed by field key. Insertion order matches the schema's declaration order.                     |
| `reachableFields`  | `ComputedRef<Partial<Record<Key, { isReachable: boolean; enumOptions?: readonly string[] }>>>` | Computed ref of the reachable subset; unreachable keys are absent. `Object.keys(reachableFields.value)` gives the live ordered list.  |
| `isReachableField` | `(key: Key) => boolean`                                                                        | Plain function that reads the current `reachableFields.value` — usable from templates without `.value` and from `<script setup>` too. |

Keys are typed using `SchemaKeys<typeof schema>` from `@liveschema/core`, so `isReachableField('typo')` is a compile-time error.

## Examples

- [examples/vue-example](../../examples/vue-example) — Vue 3 + vee-validate (single-page) [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/dominikjasek-liveschema-sks7e1yx?file=src%2Fschemas.ts)
