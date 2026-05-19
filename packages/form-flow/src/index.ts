import type { StandardSchemaV1 } from '@standard-schema/spec'

// ---------------------------------------------------------------------------
// defineForm — high-level builder DSL. Schema leaves are any Standard Schema
// validator (Zod, Valibot, ArkType, Effect Schema, ...). Structure (sequencing,
// equality branches, predicate gates) is expressed via .ask() and .when().
// The resulting value shape is flat — no synthetic wrapper keys.
// ---------------------------------------------------------------------------

type FormNode =
  | { kind: 'ask'; key: string; schema: StandardSchemaV1 }
  | {
      kind: 'whenEq'
      pattern: Record<string, unknown>
      children: FormNode[]
    }
  | {
      kind: 'whenAny'
      patterns: ReadonlyArray<Record<string, unknown>>
      children: FormNode[]
    }
  | {
      kind: 'whenPred'
      predicate: (values: Record<string, unknown>) => boolean
      children: FormNode[]
    }

const FORM_NODES = Symbol('form-flow.formNodes')

type Prettify<T> = { [K in keyof T]: T[K] } & {}

// Distribute `Omit` over BR — `Omit<A | B, K>` would otherwise collapse to
// the common keys and lose discriminated-union members that only appear in
// some variants.
type BranchAdditions<BR extends object, Outer extends object> = BR extends BR
  ? Omit<BR, keyof Outer>
  : never

// Apply Prettify to every member of a union (rather than to the union as a
// whole — that would collapse the union to its common keys).
type DistPrettify<T> = T extends object ? Prettify<T> : T

// Convert `{x: 'a'|'b', y: T}` into `{x: 'a', y: T} | {x: 'b', y: T}` so the
// resulting V is a true discriminated union on K.
type DistributeOnKey<V extends object, K extends keyof V> = V extends V
  ? V[K] extends infer U
    ? U extends V[K]
      ? Prettify<Omit<V, K> & { [P in K]: U }>
      : never
    : never
  : never

// Distribute V on every key shared with P, *iteratively* — for multi-key
// patterns like `{animal: 'dog', havePets: 'yes'}` we need the full
// cross-product (one variant per combination of literal values), not just
// the union of single-key distributions. Otherwise the "imprecise" variants
// (with the un-distributed union-valued keys) leak through and dilute the
// narrowing in downstream `V extends P` checks.
//
// We iterate keys via a tuple (UnionToTuple) so each distribution applies to
// the result of the previous one (sequential composition) rather than via TS
// union distribution which forks parallel branches and reunions stale variants.
//
// `[never]` short-circuit: when P is a union with disjoint keys (e.g.
// `{animal:'dog'} | {email:'x'}`), `keyof P` collapses to `never` (TS's
// `keyof (A|B) = keyof A & keyof B` rule). Skip distribution and return V —
// downstream `V extends P` handles OR via subtype rules.
type DistributeForMatch<V extends object, P extends object> =
  [keyof P & keyof V] extends [never]
    ? V
    : UnionToTuple<keyof P & keyof V> extends infer KT extends ReadonlyArray<PropertyKey>
      ? DistMulti<V, KT>
      : V

type DistMulti<V extends object, KT extends ReadonlyArray<PropertyKey>> =
  KT extends readonly [infer K1, ...infer Rest]
    ? K1 extends keyof V
      ? Rest extends ReadonlyArray<PropertyKey>
        ? DistributeOnKey<V, K1> extends infer V1 extends object
          ? DistMulti<V1, Rest>
          : V
        : V
      : V
    : V

type UnionToIntersection<U> = (U extends U ? (k: U) => void : never) extends (
  k: infer I,
) => void
  ? I
  : never
type LastOf<U> =
  UnionToIntersection<U extends U ? () => U : never> extends () => infer R ? R : never
type UnionToTuple<U, Last = LastOf<U>> = [U] extends [never]
  ? []
  : [...UnionToTuple<Exclude<U, Last>>, Last]

// Only the variants of V that match P. Used to construct the branch
// callback's V, so the branch doesn't see zombie non-matching variants.
type FilterMatching<V extends object, P extends object> =
  DistributeForMatch<V, P> extends infer DV
    ? DV extends object
      ? DV extends P
        ? DV
        : never
      : never
    : never

// `.when({k: lit}, ...)` result: distribute V on keyof P, then for each
// variant: if it matches P → add branch fields (required), else leave alone.
type WhenEqResult<V extends object, P extends object, BR extends object> =
  DistributeForMatch<V, P> extends infer DV
    ? DV extends object
      ? DV extends P
        ? DistPrettify<DV & BranchAdditions<BR, DV>>
        : DV
      : never
    : never

// `.when(or(...), ...)` result: like WhenEqResult, but variants that DON'T
// statically match any pattern still get the new fields as OPTIONAL — because
// at runtime an OR pattern with non-literal-narrowable keys (e.g. a `string`
// field that's only sometimes a specific literal) can fire on variants TS
// can't prove match.
type WhenOrResult<V extends object, P extends object, BR extends object> =
  DistributeForMatch<V, P> extends infer DV
    ? DV extends object
      ? DV extends P
        ? DistPrettify<DV & BranchAdditions<BR, DV>>
        : DistPrettify<DV & Partial<BranchAdditions<BR, DV>>>
      : never
    : never

export type FormBuilder<V extends object = object> = {
  ask<K extends string, S extends StandardSchemaV1>(
    key: K,
    schema: S,
  ): FormBuilder<DistPrettify<V & { [P in K]: StandardSchemaV1.InferOutput<S> }>>

  when<const P extends Partial<V>, BR extends object>(
    pattern: P,
    branch: (b: FormBuilder<DistPrettify<FilterMatching<V, P>>>) => FormBuilder<BR>,
  ): FormBuilder<WhenEqResult<V, P, BR>>

  when<BR extends object>(
    predicate: (values: Partial<V>) => boolean,
    branch: (b: FormBuilder<V>) => FormBuilder<BR>,
  ): FormBuilder<DistPrettify<V & Partial<BranchAdditions<BR, V>>>>

  /**
   * OR branch: fires when the current values match *any* pattern in the array.
   * Lives on its own method (not a `.when()` overload) so the array's element
   * type contextually narrows to `Partial<V>` — giving you full autocomplete
   * on V's keys inside each pattern literal.
   *
   * Variants matching any pattern get the new field as REQUIRED; variants
   * that don't statically match still get it as OPTIONAL, because patterns
   * with non-literal keys (e.g. `email: string`) can fire at runtime on
   * variants TS can't prove match.
   */
  whenAny<const Ps extends ReadonlyArray<Partial<V>>, BR extends object>(
    patterns: Ps,
    branch: (b: FormBuilder<DistPrettify<FilterMatching<V, Ps[number]>>>) => FormBuilder<BR>,
  ): FormBuilder<WhenOrResult<V, Ps[number], BR>>

  readonly [FORM_NODES]: FormNode[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function defineForm(): FormBuilder<{}> {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  return makeFormBuilder([]) as unknown as FormBuilder<{}>
}

function makeFormBuilder(nodes: FormNode[]): FormBuilder<object> {
  const builder = {
    [FORM_NODES]: nodes,
    ask(key: string, schema: StandardSchemaV1) {
      return makeFormBuilder([...nodes, { kind: 'ask', key, schema }])
    },
    when(patternOrPred: unknown, branchFn: (b: FormBuilder<object>) => FormBuilder<object>) {
      const inner = branchFn(makeFormBuilder([]))
      const children = inner[FORM_NODES]
      const node: FormNode =
        typeof patternOrPred === 'function'
          ? {
              kind: 'whenPred',
              predicate: patternOrPred as (v: Record<string, unknown>) => boolean,
              children,
            }
          : {
              kind: 'whenEq',
              pattern: patternOrPred as Record<string, unknown>,
              children,
            }
      return makeFormBuilder([...nodes, node])
    },
    whenAny(
      patterns: ReadonlyArray<Record<string, unknown>>,
      branchFn: (b: FormBuilder<object>) => FormBuilder<object>,
    ) {
      const inner = branchFn(makeFormBuilder([]))
      const node: FormNode = { kind: 'whenAny', patterns, children: inner[FORM_NODES] }
      return makeFormBuilder([...nodes, node])
    },
  } as unknown as FormBuilder<object>
  return builder
}

export type FormField<K extends string = string> = {
  key: K
  schema: StandardSchemaV1
  value: unknown
}

/**
 * Best-effort accessor for the enum option values of a Standard Schema
 * validator. Reads the `.options` property convention shared by Zod
 * (`z.enum(...)`), Valibot, and similar libraries; returns `undefined` for
 * non-enum schemas (or validators that don't surface options this way).
 * Useful for rendering radios / selects without re-declaring the literal
 * list at the UI layer.
 */
export function enumOptions(schema: StandardSchemaV1): readonly string[] | undefined {
  const opts = (schema as { options?: unknown }).options
  if (!Array.isArray(opts)) return undefined
  for (const o of opts) if (typeof o !== 'string') return undefined
  return opts as readonly string[]
}

/** Distributive union of all field keys across every variant of a form's value type. */
type DistributeKeys<V> = V extends unknown ? keyof V & string : never
export type FormKeys<F> = DistributeKeys<InferForm<F>>

/**
 * Extract the accumulated value shape from a form built with `defineForm()`.
 * The result is a discriminated union over every reachable branch path —
 * fields gated by an equality `.when({k: lit}, ...)` are required in the
 * matching variant. Use `Partial<InferForm<typeof form>>` if you're modeling
 * in-progress (partially-filled) state.
 */
export type InferForm<F> = F extends FormBuilder<infer V> ? V : never

/**
 * Per-field value lookup across every variant of a form's inferred type.
 * Returns the union of `V[K]` for every variant V where K is a key — useful
 * when a step component needs the type of a single field without caring
 * which branch it lives in.
 *
 * @example
 *   type SizeValue = InferField<typeof form, 'size'>     // 'large' | 'small'
 *   type Name = InferField<typeof form, 'ownerName'>     // string
 */
export type InferField<F, K extends string> =
  InferForm<F> extends infer V ? (V extends Record<K, infer T> ? T : never) : never

/** Ordered list of currently-reachable fields given the current values. */
export function activeFields<V extends object>(
  form: FormBuilder<V>,
  values: Partial<V> | Record<string, unknown>,
): Array<FormField<DistributeKeys<V>>> {
  const out: FormField[] = []
  walkFormNodes(form[FORM_NODES], values as Record<string, unknown>, out)
  return out as Array<FormField<DistributeKeys<V>>>
}

/**
 * Set of keys reachable in the current state — useful for pruning orphans.
 * Returns `Set<string>` (not a narrowed union) so callers can test arbitrary
 * runtime keys via `.has()` without contravariance issues.
 */
export function reachableKeys<V extends object>(
  form: FormBuilder<V>,
  values: Partial<V> | Record<string, unknown>,
): Set<string> {
  return new Set(activeFields(form, values).map((s) => s.key))
}

/** Flat `{ fieldKey: firstMessage }` shape produced by `validateForm`. */
export type FormErrors<F> = Partial<Record<FormKeys<F>, string>>

/**
 * Validate the currently-reachable fields against `values`. Returns a flat
 * `{ fieldKey: firstMessage }` record (empty when valid), suitable for use
 * directly as a Formik / Final Form / vee-validate `validate` function.
 *
 * Synchronous unless any active validator returns a Promise, in which case
 * the whole call resolves asynchronously. Only the first issue per field is
 * surfaced; consumers that need nested paths or every issue should fall back
 * to `activeFields` and call each field's Standard Schema validator directly.
 */
export function validateForm<V extends object>(
  form: FormBuilder<V>,
  values: Partial<V> | Record<string, unknown>,
): FormErrors<FormBuilder<V>> | Promise<FormErrors<FormBuilder<V>>> {
  const data = values as Record<string, unknown>
  const fields = activeFields(form, data)
  const errors: Record<string, string> = {}
  const pending: Array<Promise<void>> = []

  for (const field of fields) {
    const result = field.schema['~standard'].validate(data[field.key])
    if (result instanceof Promise) {
      pending.push(
        result.then((r) => {
          if (r.issues && r.issues.length > 0) errors[field.key] = r.issues[0].message
        }),
      )
    } else if (result.issues && result.issues.length > 0) {
      errors[field.key] = result.issues[0].message
    }
  }

  if (pending.length === 0) return errors as FormErrors<FormBuilder<V>>
  return Promise.all(pending).then(() => errors as FormErrors<FormBuilder<V>>)
}

/**
 * Build a single Standard Schema validator for a form-flow form. Each
 * `validate(value)` call re-evaluates which fields are reachable given the
 * current `value`, then validates each active field against its own schema.
 *
 * Issues are tagged with the field's key as the first path segment, so
 * consumers that route errors by path (TanStack Form's `onDynamic`,
 * `@hookform/resolvers/standard-schema`, etc.) deliver each message to the
 * right field. Vendor is reported as `"form-flow"`.
 *
 * `TIn` defaults to `Partial<V>` but can be widened (e.g. to a flat partial
 * of all reachable keys) when a consumer needs a non-union input shape.
 */
export function toStandardSchema<V extends object, TIn = Partial<V>>(
  form: FormBuilder<V>,
): StandardSchemaV1<TIn, V> {
  return {
    '~standard': {
      version: 1,
      vendor: 'form-flow',
      validate(input) {
        const data = (input ?? {}) as Record<string, unknown>
        const fields = activeFields(form, data)
        const issues: StandardSchemaV1.Issue[] = []
        const out: Record<string, unknown> = {}
        const pending: Array<Promise<void>> = []

        for (const field of fields) {
          const result = field.schema['~standard'].validate(data[field.key])
          if (result instanceof Promise) {
            pending.push(result.then((r) => collectField(r, field.key, issues, out)))
          } else {
            collectField(result, field.key, issues, out)
          }
        }

        const finalize = (): StandardSchemaV1.Result<V> =>
          issues.length ? { issues } : { value: out as V }

        if (pending.length > 0) return Promise.all(pending).then(finalize)
        return finalize()
      },
    },
  }
}

function collectField(
  result: StandardSchemaV1.Result<unknown>,
  key: string,
  issues: StandardSchemaV1.Issue[],
  out: Record<string, unknown>,
): void {
  if (result.issues) {
    for (const issue of result.issues) {
      issues.push({ message: issue.message, path: [key, ...(issue.path ?? [])] })
    }
  } else {
    out[key] = result.value
  }
}

function walkFormNodes(nodes: FormNode[], values: Record<string, unknown>, out: FormField[]): void {
  for (const node of nodes) {
    if (node.kind === 'ask') {
      out.push({ key: node.key, schema: node.schema, value: values[node.key] })
    } else if (node.kind === 'whenEq') {
      const match = Object.entries(node.pattern).every(([k, v]) => values[k] === v)
      if (match) walkFormNodes(node.children, values, out)
    } else if (node.kind === 'whenAny') {
      const match = node.patterns.some((p) =>
        Object.entries(p).every(([k, v]) => values[k] === v),
      )
      if (match) walkFormNodes(node.children, values, out)
    } else {
      if (node.predicate(values)) walkFormNodes(node.children, values, out)
    }
  }
}
