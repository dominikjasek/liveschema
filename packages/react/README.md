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
  const { fields, activeFields, isActiveField } = useLiveSchema(schema, values)

  return (
    <form>
      {/* Gate JSX directly with the predicate — no manual Set tracking. */}
      {isActiveField('paymentMethod') && (
        <PaymentRadios options={fields.paymentMethod.enumOptions ?? []} />
      )}

      {/* Or iterate the active subset in source order. */}
      {Object.entries(activeFields).map(([key, info]) => (
        <Field key={key} name={key} options={info?.enumOptions ?? []} />
      ))}
    </form>
  )
}
```

### Return shape

| Property        | Type                                                                           | Meaning                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| `fields`        | `Record<Key, { isActive: boolean; enumOptions?: readonly string[] }>`          | Every declared field, keyed by field key. Insertion order matches the schema's declaration order.                              |
| `activeFields`  | `Partial<Record<Key, { isActive: boolean; enumOptions?: readonly string[] }>>` | The currently-reachable subset of `fields`; inactive keys are absent. `Object.keys(activeFields)` gives the live ordered list. |
| `isActiveField` | `(key: Key) => boolean`                                                        | Predicate equivalent to `key in activeFields`. Use for JSX gating.                                                             |

Keys are typed using `SchemaKeys<typeof schema>` from `@liveschema/core`, so `isActiveField('typo')` is a compile-time error.

### When to reach for `@liveschema/core` directly

The hook intentionally exposes a UI-shaped slice. If you need the underlying validator for incremental per-field validation, use `activeFields(schema, values)` (the function from the core package) alongside the hook.

## Examples

- [examples/tanstack-form-example](../../examples/tanstack-form-example) — React + TanStack Form (single-page) [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/github-fcjshzse?file=src%2FFormPage.tsx)
