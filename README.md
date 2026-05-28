# liveschema

Build a typed, branching schema from any [Standard Schema](https://standardschema.dev) validators (Zod, Valibot, ArkType, …). The inferred value type is a discriminated union over reachable branches; at runtime, get the ordered list of currently-reachable fields.

Works for conditional forms (single-page or multi-step), backend payload validation, and anywhere branching data lives.

## Packages

| Package                               | npm                 | Purpose                                                                                                     |
| ------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- |
| [`@liveschema/core`](packages/core)   | `@liveschema/core`  | `defineSchema()` builder + walker (`activeFields`, `declaredFields`, `validateSchema`, `toStandardSchema`). |
| [`@liveschema/react`](packages/react) | `@liveschema/react` | `useLiveSchema(schema, values)` hook returning `activeFieldKeys`, `fields`, `isActiveField`.                |
| [`@liveschema/vue`](packages/vue)     | `@liveschema/vue`   | Same shape as the React hook, but as a Vue composable returning computed refs.                              |

## Install

```sh
# Core only
pnpm add @liveschema/core zod

# Plus framework bindings
pnpm add @liveschema/core @liveschema/react zod   # React
pnpm add @liveschema/core @liveschema/vue zod     # Vue
```

> Migrating from the pre-0.1 unscoped `liveschema` package? Replace every
> `from 'liveschema'` import with `from '@liveschema/core'`. The runtime API
> is unchanged; only the package name moved into the `@liveschema` org.

## Quick example

```ts
import { z } from 'zod'
import { defineSchema, activeFields, validateSchema, type InferSchema } from '@liveschema/core'

const order = defineSchema()
  .field('email', z.email())
  .field('orderType', z.enum(['pickup', 'delivery']))
  .when({ orderType: 'delivery' }, (b) => b.field('leaveAtDoor', z.boolean()))
  .field('mainCourse', z.enum(['pizza', 'salad']))
  .when({ mainCourse: 'pizza' }, (b) =>
    b.field('pizzaCount', z.coerce.number().int().min(1).max(20)).when(
      (v) => Number(v.pizzaCount) >= 3,
      (b) => b.field('requestedReadyTime', z.string()),
    ),
  )

type Order = InferSchema<typeof order>
// → discriminated union over { orderType: 'pickup' | 'delivery' } × { mainCourse: 'pizza' | 'salad' },
//   with `leaveAtDoor` only present in delivery variants, `pizzaCount` only in pizza, etc.

// Walk the currently-reachable fields for some input.
const fields = activeFields(order, { orderType: 'delivery', mainCourse: 'pizza', pizzaCount: 4 })
// → [{ key: 'email', schema, value }, { key: 'orderType', ... }, { key: 'leaveAtDoor', ... },
//    { key: 'mainCourse', ... }, { key: 'pizzaCount', ... }, { key: 'requestedReadyTime', ... }]

// Flat `{ key: firstMessage }` errors for the active subset — drop into Formik / vee-validate / etc.
const errors = validateSchema(order, input)
```

## Examples

This monorepo ships runnable examples under [`examples/`](examples):

- [`vue-example/`](examples/vue-example) — `@liveschema/vue` + vee-validate, multi-step wizard. [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/dominikjasek-liveschema-217u4tgm?file=src%2Fschemas.ts)
- [`tanstack-form-example/`](examples/tanstack-form-example) — `@liveschema/react` + TanStack Form (single-page). [![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/edit/github-fcjshzse?file=src%2FFormPage.tsx)

Pick a flavor:

```sh
pnpm dev:vue        # or dev:react, dev:rhf, dev:vanilla, dev:tanstack
```

## React / Vue hooks

Each framework package exposes a `useLiveSchema(schema, values)` that returns the same three things — adapted to the framework's reactivity model:

```ts
import { useLiveSchema } from '@liveschema/react'

const { fields, activeFields, isActiveField } = useLiveSchema(order, values)
// fields:        Record<Key, {isActive, enumOptions}>           — every declared field
// activeFields:  Partial<Record<Key, {isActive, enumOptions}>>  — active subset (inactive keys absent)
// isActiveField: (key) => boolean                                — predicate for JSX gating
```

```vue
<script setup lang="ts">
import { useLiveSchema } from '@liveschema/vue'
const { fields, activeFields, isActiveField } = useLiveSchema(order, () => form.values)
</script>

<template>
  <PaymentRadios
    v-if="isActiveField('paymentMethod')"
    :options="fields.paymentMethod.enumOptions ?? []"
  />
</template>
```

## Branching constructs

| Construct                            | Fires when                          |
| ------------------------------------ | ----------------------------------- |
| `.field(key, schema)`                | always                              |
| `.when({k: literal, ...}, b => ...)` | every listed key equals its literal |
| `.whenAny([{...}, {...}], b => ...)` | any one of the patterns matches     |
| `.when(values => boolean, b => ...)` | predicate returns truthy            |

Equality `.when({k: lit})` narrows the inferred union (the new fields become required on the matching variant). Predicate `.when(fn)` adds the fields as optional, since TS can't prove the predicate at compile time. `.whenAny` requires-on-match, optional-on-rest.

## Library integration

`toStandardSchema(schema)` returns a Standard Schema validator for the whole schema — pass it to anything that accepts one (vee-validate, TanStack Form, `@hookform/resolvers/standard-schema`, …). Validation only ever covers the currently-reachable subset, and parsed output strips abandoned-branch values.

```ts
// vee-validate
const form = useForm({ validationSchema: toStandardSchema(order) })

// react-hook-form (via @hookform/resolvers/standard-schema)
useForm({ resolver: standardSchemaResolver(toStandardSchema(order)) })
```

## API

- `defineSchema()` — start a builder.
- `.field(key, schema)`, `.when(...)`, `.whenAny(...)` — compose.
- `activeFields(schema, values)` — ordered list of currently-reachable `{ key, schema, value }`.
- `declaredFields(schema, values)` — every declared field, tagged with `isActive`.
- `validateSchema(schema, values)` — flat `{ key: firstMessage }` errors (sync unless a leaf validator is async).
- `toStandardSchema(schema)` — wrap the whole schema as a single Standard Schema validator.
- `enumOptions(schema)` — best-effort accessor for a leaf's enum options (Zod / Valibot convention).
- Types: `InferSchema<F>`, `InferField<F, K>`, `SchemaKeys<F>`, `SchemaField<K>`, `DeclaredField<K>`, `SchemaErrors<F>`.

## Releasing

Releases are driven by [Changesets](https://github.com/changesets/changesets) and an automated GitHub Actions workflow ([`.github/workflows/release.yml`](.github/workflows/release.yml)):

1. After landing a PR with a changeset, the workflow opens (or updates) a "Version Packages" PR that bumps versions and updates changelogs.
2. Merging that PR publishes the affected `@liveschema/*` packages to npm and tags the commit.

The workflow needs an `NPM_TOKEN` secret with publish access to the `@liveschema` org. To release manually instead, run `pnpm run release`.
