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

const { activeFieldKeys, fields, isActiveField } = useLiveSchema(schema, () => form.values)
</script>

<template>
  <!-- Predicate works in templates because it reads .value internally. -->
  <PaymentRadios v-if="isActiveField('paymentMethod')" />

  <!-- Iterate every declared field and read isActive yourself. -->
  <Field v-for="f in fields" :key="f.key" :disabled="!f.isActive" :options="f.enumOptions ?? []" />
</template>
```

### Return shape

| Property          | Type                                                                              | Meaning                                                                                                                            |
| ----------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `activeFieldKeys` | `ComputedRef<Key[]>`                                                              | Computed ref of ordered keys whose branch path matches the current values.                                                         |
| `fields`          | `ComputedRef<{ key: Key; isActive: boolean; enumOptions?: readonly string[] }[]>` | Computed ref of every declared field, in source order; `enumOptions` is set only for enum leaves (Zod, Valibot).                   |
| `isActiveField`   | `(key: Key) => boolean`                                                           | Plain function that reads the current `activeFieldKeys.value` — usable from templates without `.value` and from script without it. |

Keys are typed using `SchemaKeys<typeof schema>` from `@liveschema/core`, so `isActiveField('typo')` is a compile-time error.
