# @liveschema/react

React bindings for [`@liveschema/core`](../core).

## Install

```sh
pnpm add @liveschema/core @liveschema/react zod
```

## Usage

`useLiveSchema(schema, values)` returns three things derived from walking the schema against the current form state:

```tsx
import { useForm, useWatch } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toStandardSchema } from '@liveschema/core'
import { useLiveSchema } from '@liveschema/react'
import { schema } from './schema'

const standardSchema = toStandardSchema(schema)

export function MyForm() {
  const { register, control } = useForm({
    resolver: standardSchemaResolver(standardSchema),
  })

  const values = useWatch({ control })
  const { activeFieldKeys, fields, isActiveField } = useLiveSchema(schema, values)

  return (
    <form>
      {/* Gate JSX directly with the predicate — no manual Set tracking. */}
      {isActiveField('paymentMethod') && <PaymentRadios />}

      {/* Or iterate every declared field and read isActive yourself. */}
      {fields.map((f) => (
        <Field key={f.key} disabled={!f.isActive} options={f.enumOptions ?? []} />
      ))}
    </form>
  )
}
```

### Return shape

| Property          | Type                                                                 | Meaning                                                                                          |
| ----------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `activeFieldKeys` | `Key[]`                                                              | Ordered keys whose branch path matches the current values.                                       |
| `fields`          | `{ key: Key; isActive: boolean; enumOptions?: readonly string[] }[]` | Every declared field, in source order; `enumOptions` is set only for enum leaves (Zod, Valibot). |
| `isActiveField`   | `(key: Key) => boolean`                                              | Predicate equivalent to `activeFieldKeys.includes(key)`. Use for JSX gating.                     |

Keys are typed using `SchemaKeys<typeof schema>` from `@liveschema/core`, so `isActiveField('typo')` is a compile-time error.

### When to reach for `@liveschema/core` directly

The hook intentionally exposes a UI-shaped slice. If you need the underlying validator for incremental per-field validation, use `activeFields(schema, values)` from the core package alongside the hook.
