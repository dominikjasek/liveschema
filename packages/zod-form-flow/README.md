# zod-form-flow

Walk a Zod-typed form schema and derive the **currently-reachable, ordered list of steps** given the form's current values. The step list re-derives as the user fills in answers — typical use case is a multi-step form where later questions depend on earlier ones.

The package returns *data* (a list of steps). It doesn't manage step index, phase, navigation, validation, errors, or UI — those belong to the consumer.

## Install

```bash
pnpm add zod-form-flow zod
```

Peer dependency: `zod ^4`.

## Quick start

```ts
import { z } from 'zod'
import { defineForm, listFormSteps, type InferForm } from 'zod-form-flow'

const form = defineForm()
  .ask('name', z.string().min(1))
  .ask('animal', z.enum(['dog', 'cat']))
  .when({ animal: 'dog' }, (b) => b.ask('dogSize', z.enum(['small', 'large'])))
  .when({ animal: 'cat' }, (b) => b.ask('indoor', z.boolean()))

type Values = InferForm<typeof form>

// Given current form values, get the live ordered step list:
const steps = listFormSteps(form, { name: 'Ada', animal: 'dog' })
// [
//   { key: 'name',    schema: z.string()..., value: 'Ada' },
//   { key: 'animal',  schema: z.enum(...),   value: 'dog' },
//   { key: 'dogSize', schema: z.enum(...),   value: undefined },
// ]
```

## DSL

### `.ask(key, schema)`

Declares a step. The schema is the validator for *that* step's value. Wrap multiple fields in a `z.object` to render them on a single screen:

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
import type { InferForm, InferField } from 'zod-form-flow'

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
import { reachableKeys } from 'zod-form-flow'

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

// 3. On Next, validate just this step's slice.
const result = current.schema.safeParse(values[current.key])
if (!result.success) {
  // Route result.error.issues to your form library's field errors.
} else {
  setValue(current.key, result.data) // persist coerced value
  setStepIndex(stepIndex + 1)
}
```

End-to-end examples:

- [packages/react-demo](../react-demo) — React + TanStack Form
- [packages/vue-demo](../vue-demo) — Vue 3 + vee-validate
- [packages/vanilla-demo](../vanilla-demo) — no form library

## API

| Export | Purpose |
| --- | --- |
| `defineForm()` | Start a form builder |
| `.ask(key, schema)` | Declare a step |
| `.when(pattern, branch)` | Equality-gated sub-flow |
| `.when(predicate, branch)` | Predicate-gated sub-flow |
| `listFormSteps(form, values)` | Ordered list of currently-reachable steps |
| `reachableKeys(form, values)` | `Set<string>` of currently-reachable keys |
| `InferForm<F>` | Discriminated-union value type |
| `InferField<F, K>` | Type of a single field across variants |
| `FormStep` | `{ key, schema, value }` returned by the walker |

## What this package is *not*

- **Not a form library** — bring your own (TanStack Form, vee-validate, React Hook Form, plain state). The package just gives you the step list; you keep the values.
- **Not a UI library** — render however you want, keyed by `step.key`.
- **Doesn't track step index, phase ("fill" vs "review"), or navigation** — that's all in the consumer.
- **Doesn't route validation errors into form-library field state** — the consumer does that with the issues from `step.schema.safeParse(values[step.key])`.
