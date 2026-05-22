# liveschema

Build a typed, branching schema from any [Standard Schema](https://standardschema.dev) validators (Zod, Valibot, ArkType, Effect Schema, …). The inferred value type is a **discriminated union** over every reachable branch — and at runtime, given the current values, you get the **ordered list of currently-reachable fields**.

Same definition powers:

- **Conditional forms** — single-page or multi-step, the live field list re-derives as values change.
- **Backend validation** — feed a request body through `toStandardSchema(schema)` and reject shapes that don't match any reachable branch.
- **Anywhere you have branching data** — surveys, decision trees, configuration with conditional sections.

The package returns _data_ (a list of fields, or a Standard Schema validator). It doesn't manage UI, navigation, errors, or form state — those belong to the consumer.

## Motivation

Branching-logic schemas, but headless and typed — your validator of choice is the source of truth, and the branch type narrows the inferred values.

Existing tools fall into two camps that each leave something on the table:

- **Config-driven survey libraries** (JSON schemas, visibility expressions parsed at runtime) ship their own renderer and return untyped result bags — TypeScript can't see the branches.
- **Generic form libraries** (React Hook Form, TanStack Form, vee-validate, Formik, …) handle field state and validation, but _branching_ is left to the consumer, and there's no inference from "which branch is active" to "which fields are now required."

`liveschema` fills the gap: the **schema is the source of truth**, branching is a typed builder DSL, and the inferred value type is a discriminated union — so inside a narrowed branch, fields that were optional in the union become required.

## Install

```bash
pnpm add liveschema
# plus whichever Standard-Schema-compliant validator you prefer:
pnpm add zod        # or: valibot, arktype, effect, ...
```

`liveschema` has no runtime dependency on any specific validation library. Bring your own.

## Quick start

```ts
import { z } from 'zod'
import { defineSchema, activeFields, type InferSchema } from 'liveschema'

const schema = defineSchema()
  .field('name', z.string().min(1))
  .field('animal', z.enum(['dog', 'cat']))
  .when({ animal: 'dog' }, (b) => b.field('dogSize', z.enum(['small', 'large'])))
  .when({ animal: 'cat' }, (b) => b.field('indoor', z.boolean()))

type Values = InferSchema<typeof schema>

// Given current values, get the live ordered list of reachable fields:
const fields = activeFields(schema, { name: 'Ada', animal: 'dog' })
// [
//   { key: 'name',    schema: <standard schema>, value: 'Ada' },
//   { key: 'animal',  schema: <standard schema>, value: 'dog' },
//   { key: 'dogSize', schema: <standard schema>, value: undefined },
// ]
```

## DSL

### `.field(key, schema)`

Declares a field. The schema is any Standard Schema validator for _that_ field's value. Wrap multiple subfields in an object schema to group them:

```ts
.field('owner', z.object({
  name: z.string().min(1),
  email: z.email(),
}))
```

The resulting value is nested: `values.owner.name`.

### `.when({ key: literal }, branch)`

Equality branch. Inner fields are reachable only while every `key=literal` matches the current values. Also narrows the inferred type — inside `.when({ animal: 'dog' }, ...)` the `dogSize` field becomes _required_ on that union variant.

### `.when((values) => boolean, branch)`

Predicate branch. Same gating behavior, but the condition is a function. TypeScript can't reason about arbitrary predicates, so branch fields are added as `Partial` rather than narrowed to required.

### `.whenAny([pattern1, pattern2, ...], branch)`

OR branch — inner fields are reachable when the current values match _any_ pattern. Variants statically matching at least one pattern get the new fields as required; other variants get them as optional.

## Type inference

```ts
import type { InferSchema, InferField } from 'liveschema'

type Values = InferSchema<typeof schema> // discriminated union of branches
type DogSize = InferField<typeof schema, 'dogSize'> // 'small' | 'large'
```

`Values` is a discriminated union, so destructuring inside a narrowed branch sees required (not optional) fields:

```ts
function handle(v: Values) {
  if (v.animal === 'dog') {
    const size: 'small' | 'large' = v.dogSize // typed required
  }
}
```

Use `Partial<Values>` to model in-progress (partially-filled) state.

## Backend validation

`toStandardSchema(schema)` returns a single Standard Schema that validates the currently-reachable fields. Plug it into any framework that accepts Standard Schema:

```ts
import { toStandardSchema } from 'liveschema'

const standard = toStandardSchema(schema)
const result = standard['~standard'].validate(await req.json())
if (result instanceof Promise) {
  // some validator was async
} else if (result.issues) {
  // 422 with result.issues
} else {
  // result.value is fully typed and only contains reachable fields
}
```

## Pruning orphaned values

When the user changes a branch discriminator (e.g. switches `animal` from `'dog'` to `'cat'`), previously-set values on the abandoned branch (`dogSize`) may no longer be reachable. Build a `Set` from `activeFields()` and drop the rest:

```ts
const keep = new Set(activeFields(schema, values).map((f) => f.key))
const cleaned = Object.fromEntries(Object.entries(values).filter(([k]) => keep.has(k)))
```

## Rendering the active fields

```ts
// 1. Live field list, re-derived from current values on every render.
const fields = activeFields(schema, values)

// 2. Render however you like — single page, one-field-per-screen wizard,
//    grouped sections — keyed by `field.key`.
for (const field of fields) {
  // pick an input based on `field.schema` (radio for enums, checkbox for
  // booleans, text input otherwise) and bind to `values[field.key]`.
}

// 3. Validate a single field — useful for per-field "Next" buttons:
const result = field.schema['~standard'].validate(values[field.key])
if (result instanceof Promise) {
  // handle async validators
} else if (result.issues) {
  // route result.issues to your form library's field errors
} else {
  setValue(field.key, result.value) // persist coerced value
}
```

End-to-end examples:

- [packages/examples/react-example](../examples/react-example) — React + TanStack Form (multi-step wizard)
- [packages/examples/react-hook-form-example](../examples/react-hook-form-example) — React + react-hook-form (single-page, via `@hookform/resolvers/standard-schema`)
- [packages/examples/vue-example](../examples/vue-example) — Vue 3 + vee-validate (multi-step wizard)
- [packages/examples/svelte-example](../examples/svelte-example) — Svelte 5 + Felte + Effect Schema (single-page)
- [packages/examples/tanstack-form-example](../examples/tanstack-form-example) — React + TanStack Form (single-page)
- [packages/examples/vanilla-example](../examples/vanilla-example) — no form library

## API

| Export                           | Purpose                                                                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `defineSchema()`                 | Start a schema builder                                                                                                                                                        |
| `.field(key, schema)`            | Declare a field (schema is any Standard Schema validator)                                                                                                                     |
| `.when(pattern, branch)`         | Equality-gated sub-branch                                                                                                                                                     |
| `.when(predicate, branch)`       | Predicate-gated sub-branch                                                                                                                                                    |
| `.whenAny(patterns, branch)`     | OR-gated sub-branch                                                                                                                                                           |
| `activeFields(schema, values)`   | Ordered list of currently-reachable fields                                                                                                                                    |
| `validateSchema(schema, values)` | `{ key: firstMessage }` errors for reachable fields — plug straight into Formik/vee-validate/etc. `validate`                                                                  |
| `toStandardSchema(schema)`       | One Standard Schema validating the currently-reachable fields — for TanStack Form's `onDynamic`, react-hook-form's standard-schema resolver, backend request validation, etc. |
| `enumOptions(schema)`            | Best-effort enum option list (`undefined` for non-enum schemas) — handy for rendering radios/selects                                                                          |
| `InferSchema<F>`                 | Discriminated-union value type                                                                                                                                                |
| `InferField<F, K>`               | Type of a single field across variants                                                                                                                                        |
| `SchemaField`                    | `{ key, schema, value }` returned by `activeFields`                                                                                                                           |

## What this package is _not_

- **Not a form library** — bring your own (TanStack Form, vee-validate, React Hook Form, plain state). The package gives you the active-field list; you keep the values.
- **Not a UI library** — render however you want, keyed by `field.key`.
- **Doesn't track navigation or phase** (e.g. "fill" vs "review", current-step index) — that's all in the consumer.
- **Doesn't route validation errors into form-library field state** — the consumer does that with the issues from `field.schema['~standard'].validate(values[field.key])`.
