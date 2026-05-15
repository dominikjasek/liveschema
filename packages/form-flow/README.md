# form-flow

Build a typed, branching multi-step form from any [Standard Schema](https://standardschema.dev) validators (Zod, Valibot, ArkType, Effect Schema, …). Returns the **currently-reachable, ordered list of steps** given the form's current values. The step list re-derives as the user fills in answers — typical use case is a multi-step form where later questions depend on earlier ones.

The package returns *data* (a list of steps). It doesn't manage step index, phase, navigation, validation, errors, or UI — those belong to the consumer.

## Motivation

Branching-logic forms, but headless and typed — Zod (or any Standard Schema) is the source of truth, and the branch type narrows the inferred values.

Existing branching/wizard tools fall into two camps that each leave something on the table:

- **Config-driven survey libraries** (JSON schemas, visibility expressions parsed at runtime) ship their own renderer and return untyped result bags — TypeScript can't see the branches.
- **Generic form libraries** (React Hook Form, TanStack Form, vee-validate, Formik, …) are great at field state and validation, but multi-step *branching* is left to the consumer, and there's no inference from "which branch is active" to "which fields are now required."

`form-flow` fills the gap: the **schema is the source of truth**, branching is a typed builder DSL, and the inferred value type is a discriminated union — so inside a narrowed branch, fields that were optional in the union become required.

## Install

```bash
pnpm add form-flow
# plus whichever Standard-Schema-compliant validator you prefer:
pnpm add zod        # or: valibot, arktype, effect, ...
```

`form-flow` has no runtime dependency on any specific validation library. Bring your own.

## Quick start

```ts
import { z } from 'zod'
import { defineForm, listFormSteps, type InferForm } from 'form-flow'

const form = defineForm()
  .ask('name', z.string().min(1))
  .ask('animal', z.enum(['dog', 'cat']))
  .when({ animal: 'dog' }, (b) => b.ask('dogSize', z.enum(['small', 'large'])))
  .when({ animal: 'cat' }, (b) => b.ask('indoor', z.boolean()))

type Values = InferForm<typeof form>

// Given current form values, get the live ordered step list:
const steps = listFormSteps(form, { name: 'Ada', animal: 'dog' })
// [
//   { key: 'name',    schema: <standard schema>, value: 'Ada' },
//   { key: 'animal',  schema: <standard schema>, value: 'dog' },
//   { key: 'dogSize', schema: <standard schema>, value: undefined },
// ]
```

## DSL

### `.ask(key, schema)`

Declares a step. The schema is any Standard Schema validator for *that* step's value. Wrap multiple fields in an object schema to render them on a single screen:

```ts
.ask('owner', z.object({
  name: z.string().min(1),
  email: z.email(),
}))
```

The resulting value is nested: `values.owner.name`.

### `.when({ key: literal }, branch)`

Equality branch. Inner steps are reachable only while every `key=literal` matches the current values. Also narrows the inferred type — inside `.when({ animal: 'dog' }, ...)` the `dogSize` field becomes *required* on that union variant.

### `.when((values) => boolean, branch)`

Predicate branch. Same gating behavior, but the condition is a function. TypeScript can't reason about arbitrary predicates, so branch fields are added as `Partial` rather than narrowed to required.

## Type inference

```ts
import type { InferForm, InferField } from 'form-flow'

type Values = InferForm<typeof form>              // discriminated union of branches
type DogSize = InferField<typeof form, 'dogSize'> // 'small' | 'large'
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

## Pruning orphaned values

When a user revisits an earlier step and changes a branch discriminator, previously-set values on the abandoned branch may no longer be reachable. `reachableKeys()` returns the keys that *are* reachable now, so you can drop the rest:

```ts
import { reachableKeys } from 'form-flow'

const keep = reachableKeys(form, values)
const cleaned = Object.fromEntries(
  Object.entries(values).filter(([k]) => keep.has(k)),
)
```

## Typical integration

```ts
// 1. Live step list, re-derived from current values on every render.
const steps = listFormSteps(form, values)

// 2. Pick the current step (consumer owns the index).
const current = steps[stepIndex]

// 3. On Next, validate just this step's slice via Standard Schema.
const result = current.schema['~standard'].validate(values[current.key])
if (result instanceof Promise) {
  // handle async validators
} else if (result.issues) {
  // route result.issues to your form library's field errors
} else {
  setValue(current.key, result.value) // persist coerced value
  setStepIndex(stepIndex + 1)
}
```

End-to-end examples:

- [packages/examples/react-example](../examples/react-example) — React + TanStack Form
- [packages/examples/react-hook-form-example](../examples/react-hook-form-example) — React + react-hook-form (via `@form-flow/react-hook-form`)
- [packages/examples/formik-example](../examples/formik-example) — React + Formik + ArkType
- [packages/examples/vue-example](../examples/vue-example) — Vue 3 + vee-validate
- [packages/examples/vanilla-example](../examples/vanilla-example) — no form library

## API

| Export | Purpose |
| --- | --- |
| `defineForm()` | Start a form builder |
| `.ask(key, schema)` | Declare a step (schema is any Standard Schema validator) |
| `.when(pattern, branch)` | Equality-gated sub-flow |
| `.when(predicate, branch)` | Predicate-gated sub-flow |
| `listFormSteps(form, values)` | Ordered list of currently-reachable steps |
| `reachableKeys(form, values)` | `Set<string>` of currently-reachable keys |
| `validateForm(form, values)` | `{ key: firstMessage }` errors for reachable steps — plug straight into Formik/vee-validate/etc. `validate` |
| `InferForm<F>` | Discriminated-union value type |
| `InferField<F, K>` | Type of a single field across variants |
| `FormStep` | `{ key, schema, value }` returned by the walker |

## What this package is *not*

- **Not a form library** — bring your own (TanStack Form, vee-validate, React Hook Form, plain state). The package just gives you the step list; you keep the values.
- **Not a UI library** — render however you want, keyed by `step.key`.
- **Doesn't track step index, phase ("fill" vs "review"), or navigation** — that's all in the consumer.
- **Doesn't route validation errors into form-library field state** — the consumer does that with the issues from `step.schema['~standard'].validate(values[step.key])`.
