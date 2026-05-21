# liveschema

Build a typed, branching schema from any [Standard Schema](https://standardschema.dev) validators (Zod, Valibot, ArkType, …). The inferred value type is a discriminated union over reachable branches; at runtime, get the ordered list of currently-reachable fields.

Works for conditional forms (single-page or multi-step), backend payload validation, and anywhere branching data lives.

## Install

```sh
pnpm add liveschema zod
```

## Quick example

```ts
import { z } from 'zod'
import { defineSchema, activeFields, validateSchema, type InferSchema } from 'liveschema'

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
- `validateSchema(schema, values)` — flat `{ key: firstMessage }` errors (sync unless a leaf validator is async).
- `toStandardSchema(schema)` — wrap the whole schema as a single Standard Schema validator.
- `enumOptions(schema)` — best-effort accessor for a leaf's enum options (Zod / Valibot convention).
- Types: `InferSchema<F>`, `InferField<F, K>`, `SchemaKeys<F>`, `SchemaField<K>`, `SchemaErrors<F>`.

## Examples

This monorepo ships runnable examples under [`packages/examples/`](packages/examples):

- [`vanilla-example/`](packages/examples/vanilla-example) — plain DOM, progressive reveal.
- [`vue-example/`](packages/examples/vue-example) — vee-validate, multi-step wizard with grouped steps.
- [`react-example/`](packages/examples/react-example) — TanStack Form.
- [`react-hook-form-example/`](packages/examples/react-hook-form-example) — react-hook-form + standard-schema resolver.
- [`tanstack-form-example/`](packages/examples/tanstack-form-example) — TanStack Form, alternate styling.
- [`svelte-example/`](packages/examples/svelte-example) — Svelte.

Pick a flavor:

```sh
pnpm dev:vue        # or dev:react, dev:vanilla, dev:tanstack
```
