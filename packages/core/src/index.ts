import type { StandardSchemaV1 } from '@standard-schema/spec'

// ---------------------------------------------------------------------------
// defineSchema — high-level builder DSL. Schema leaves are any Standard Schema
// validator (Zod, Valibot, ArkType, Effect Schema, ...). Structure (sequencing,
// equality branches, predicate gates) is expressed via .field() and .when().
// The resulting value shape is flat — no synthetic wrapper keys.
// ---------------------------------------------------------------------------

type SchemaNode =
  | { kind: 'field'; key: string; schema: StandardSchemaV1 }
  | {
      kind: 'whenEq'
      pattern: Record<string, unknown>
      children: SchemaNode[]
    }
  | {
      kind: 'whenAny'
      patterns: ReadonlyArray<Record<string, unknown>>
      children: SchemaNode[]
    }
  | {
      kind: 'whenPred'
      predicate: (values: Record<string, unknown>) => boolean
      children: SchemaNode[]
    }

const SCHEMA_NODES = Symbol('liveschema.schemaNodes')

type Prettify<T> = { [K in keyof T]: T[K] } & {}

// Pair each outer variant with the single BR variant whose shape extends it,
// rather than crossing each outer variant with every BR variant. The previous
// "BR extends BR ? Omit<BR, keyof Outer>" form distributed over BR and then
// intersected unconditionally — producing both an exponential variant blow-up
// (which trips TS2589) and incorrect narrowing in nested branches (e.g.
// `housingType='house'` paired with the apartment branch's dogSize literals).
//
// Extract<BR, Outer> returns only the BR variants assignable to Outer; we then
// intersect to get the additions correctly narrowed for that variant.
type BranchAdditions<BR extends object, Outer extends object> = Extract<BR, Outer>

// Keys BR added on top of V (independent of any particular outer variant).
// Used by WhenOrResult's non-matching branch where we add the new fields as
// optional; per-variant Extract returns `never` there because the non-matching
// DV doesn't share BR's path.
type NewBranchFields<BR extends object, V extends object> = [Exclude<keyof BR, keyof V>] extends [
  infer NK extends keyof BR,
]
  ? Pick<BR, NK>
  : never

// Reject pattern keys that aren't in V. `P extends Partial<V>` accepts excess
// keys structurally — and generic inference (`const P extends Partial<V>`)
// further suppresses the excess-property check that would normally fire on a
// fresh object literal. Intersecting the parameter with `{[K in extras]: never}`
// forces any extra key's value to be `never`, which the literal can't satisfy.
type NoExtraKeys<V, P> = { [K in Exclude<keyof P, keyof V>]: never }

// Apply Prettify to every member of a union (rather than to the union as a
// whole — that would collapse the union to its common keys).
type DistPrettify<T> = T extends object ? Prettify<T> : T

// Convert `{x: 'a'|'b', y: T}` into `{x: 'a', y: T} | {x: 'b', y: T}` so the
// resulting V is a true discriminated union on K. We intentionally don't
// `Prettify` the result — DistMulti chains multiple DistributeOnKey calls
// and the final `DistPrettify` in WhenEqResult/WhenOrResult is enough.
// Each extra Prettify materializes a fresh mapped type, compounding
// instantiation depth (TS2589) on long .when() chains.
type DistributeOnKey<V extends object, K extends keyof V> = V extends V
  ? V[K] extends infer U
    ? U extends V[K]
      ? Omit<V, K> & { [P in K]: U }
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
//
// Fast-path the single-key case (`.when({k: lit}, ...)` — the overwhelming
// majority of patterns): one `DistributeOnKey` call, skipping `UnionToTuple`
// + `DistMulti`. `IsUnion<K>` is the cheap two-conditional union detector.
type IsUnion<T, U = T> = T extends U ? ([U] extends [T] ? false : true) : never

type DistributeForMatch<V extends object, P extends object> = keyof P &
  keyof V extends infer K extends keyof V
  ? [K] extends [never]
    ? V
    : IsUnion<K> extends false
      ? DistributeOnKey<V, K>
      : UnionToTuple<K> extends infer KT extends ReadonlyArray<PropertyKey>
        ? DistMulti<V, KT>
        : V
  : V

type DistMulti<V extends object, KT extends ReadonlyArray<PropertyKey>> = KT extends readonly [
  infer K1,
  ...infer Rest,
]
  ? K1 extends keyof V
    ? Rest extends ReadonlyArray<PropertyKey>
      ? DistributeOnKey<V, K1> extends infer V1 extends object
        ? DistMulti<V1, Rest>
        : V
      : V
    : V
  : V

type UnionToIntersection<U> = (U extends U ? (k: U) => void : never) extends (k: infer I) => void
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
// We `DistPrettify` at branch boundaries (the `.when` result) but NOT at
// every `.field`: this flattens the union variants that subsequent `Omit`/
// `keyof` operations walk, keeping later `DistributeForMatch` calls fast.
// Dropping these two `DistPrettify` calls measurably *increases* check time
// because downstream operations then have to traverse a deeper intersection
// tree per variant — even though raw type/instantiation counts drop.
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
// can't prove match. Use NewBranchFields for the non-matching case since
// per-variant Extract returns `never` there.
type WhenOrResult<V extends object, P extends object, BR extends object> =
  DistributeForMatch<V, P> extends infer DV
    ? DV extends object
      ? DV extends P
        ? DistPrettify<DV & BranchAdditions<BR, DV>>
        : DistPrettify<DV & Partial<NewBranchFields<BR, V>>>
      : never
    : never

export type SchemaBuilder<V extends object = object> = {
  field<K extends string, S extends StandardSchemaV1>(
    key: K,
    schema: S,
  ): SchemaBuilder<V & { [P in K]: StandardSchemaV1.InferOutput<S> }>

  when<const P extends Partial<V>, BR extends object>(
    pattern: P & NoExtraKeys<V, P>,
    branch: (b: SchemaBuilder<FilterMatching<V, P>>) => SchemaBuilder<BR>,
  ): SchemaBuilder<WhenEqResult<V, P, BR>>

  when<BR extends object>(
    predicate: (values: Partial<V>) => boolean,
    branch: (b: SchemaBuilder<V>) => SchemaBuilder<BR>,
  ): SchemaBuilder<V & Partial<BranchAdditions<BR, V>>>

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
    patterns: { readonly [I in keyof Ps]: Ps[I] & NoExtraKeys<V, Ps[I]> },
    branch: (b: SchemaBuilder<FilterMatching<V, Ps[number]>>) => SchemaBuilder<BR>,
  ): SchemaBuilder<WhenOrResult<V, Ps[number], BR>>

  readonly [SCHEMA_NODES]: SchemaNode[]
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export function defineSchema(): SchemaBuilder<{}> {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  return makeSchemaBuilder([]) as unknown as SchemaBuilder<{}>
}

function makeSchemaBuilder(nodes: SchemaNode[]): SchemaBuilder<object> {
  const builder = {
    [SCHEMA_NODES]: nodes,
    field(key: string, schema: StandardSchemaV1) {
      return makeSchemaBuilder([...nodes, { kind: 'field', key, schema }])
    },
    when(patternOrPred: unknown, branchFn: (b: SchemaBuilder<object>) => SchemaBuilder<object>) {
      const inner = branchFn(makeSchemaBuilder([]))
      const children = inner[SCHEMA_NODES]
      const node: SchemaNode =
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
      return makeSchemaBuilder([...nodes, node])
    },
    whenAny(
      patterns: ReadonlyArray<Record<string, unknown>>,
      branchFn: (b: SchemaBuilder<object>) => SchemaBuilder<object>,
    ) {
      const inner = branchFn(makeSchemaBuilder([]))
      const node: SchemaNode = { kind: 'whenAny', patterns, children: inner[SCHEMA_NODES] }
      return makeSchemaBuilder([...nodes, node])
    },
  } as unknown as SchemaBuilder<object>
  return builder
}

export type SchemaField<K extends string = string> = {
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

/** Distributive union of all field keys across every variant of a schema's value type. */
type DistributeKeys<V> = V extends unknown ? keyof V & string : never
export type SchemaKeys<F> = DistributeKeys<InferSchema<F>>

/**
 * Extract the accumulated value shape from a schema built with `defineSchema()`.
 * The result is a discriminated union over every reachable branch path —
 * fields gated by an equality `.when({k: lit}, ...)` are required in the
 * matching variant. Use `Partial<InferSchema<typeof schema>>` if you're modeling
 * in-progress (partially-filled) state.
 */
export type InferSchema<F> = F extends SchemaBuilder<infer V> ? DistPrettify<V> : never

/**
 * Per-field value lookup across every variant of a schema's inferred type.
 * Returns the union of `V[K]` for every variant V where K is a key — useful
 * when a renderer needs the type of a single field without caring which
 * branch it lives in.
 *
 * Uses `K extends keyof V` (rather than `V extends Record<K, infer T>`) so
 * that optional properties are picked up — fields added via predicate-form
 * `.when((v) => …, b => b.field('k', …))` land as `k?: T` in the inferred
 * value type, and the `Record<K, T>` form fails to infer `T` through an
 * optional property, collapsing the whole result to `never`. `keyof V`
 * handles both required and optional uniformly, yielding `T | undefined`
 * for optional fields.
 *
 * @example
 *   type SizeValue = InferField<typeof schema, 'size'>     // 'large' | 'small'
 *   type Name = InferField<typeof schema, 'ownerName'>     // string
 */
export type InferField<F, K extends string> =
  InferSchema<F> extends infer V
    ? V extends object
      ? K extends keyof V
        ? V[K]
        : never
      : never
    : never

// Flat, fully-optional view of a (possibly-discriminated-union) value type:
// every key across every variant becomes optional, typed as the union of V[K]
// across variants where K is present. Operates on the value shape so it can be
// used both at the schema layer (`FlatInferSchema<F>`) and as `toStandardSchema`'s
// inferred input type without re-wrapping the SchemaBuilder.
type FlatValue<V> = {
  [K in V extends unknown ? keyof V & string : never]?: V extends infer U
    ? U extends object
      ? K extends keyof U
        ? U[K]
        : never
      : never
    : never
}

/**
 * Flat, fully-optional view of a schema's value shape — every field declared in
 * any branch becomes an optional key whose type is the union of `V[K]` across
 * the variants where `K` is reachable.
 *
 * Use this for in-progress form state with libraries that want a single,
 * indexable record (React Hook Form's `useForm<T>` / `FieldErrors<T>`,
 * controlled-input wrappers, etc.) — `InferSchema` is a discriminated union
 * over branch paths, so indexing it by a generic `SchemaKeys<F>` errors with
 * ts(7053) because branch-gated keys aren't on every variant. `FlatInferSchema`
 * collapses that union so any field key is indexable everywhere. Narrow back
 * to `InferSchema<F>` at the validated-submit boundary.
 */
export type FlatInferSchema<F> = F extends SchemaBuilder<infer V> ? FlatValue<V> : never

/** Ordered list of currently-reachable fields given the current values. */
export function reachableFields<V extends object>(
  schema: SchemaBuilder<V>,
  values: Partial<V> | Record<string, unknown>,
): Array<SchemaField<DistributeKeys<V>>> {
  const out: SchemaField[] = []
  walkSchemaNodes(schema[SCHEMA_NODES], values as Record<string, unknown>, out)
  return out as Array<SchemaField<DistributeKeys<V>>>
}

/** A field declared anywhere in the schema, with whether its branch path matches the current values. */
export type DeclaredField<K extends string = string> = {
  key: K
  schema: StandardSchemaV1
  isReachable: boolean
  value: unknown
}

/**
 * Every field declared in the schema, in source order, each tagged with whether its
 * branch path is reachable given `values`. Unlike `reachableFields` (which yields only
 * reachable fields), this also surfaces fields gated behind unmatched branches —
 * useful for UIs that want to render disabled fields rather than unmount them.
 *
 * Duplicate keys (same key declared in multiple branches with different schemas)
 * are deduped by key; the reachable occurrence wins, otherwise the first declaration.
 */
export function declaredFields<V extends object>(
  schema: SchemaBuilder<V>,
  values: Partial<V> | Record<string, unknown>,
): Array<DeclaredField<DistributeKeys<V>>> {
  const out: DeclaredField[] = []
  const seen = new Map<string, number>()
  walkAllNodes(schema[SCHEMA_NODES], values as Record<string, unknown>, true, out, seen)
  return out as Array<DeclaredField<DistributeKeys<V>>>
}

/** Flat `{ fieldKey: firstMessage }` shape produced by `validateSchema`. */
export type SchemaErrors<F> = Partial<Record<SchemaKeys<F>, string>>

/**
 * Validate the currently-reachable fields against `values`. Returns a flat
 * `{ fieldKey: firstMessage }` record (empty when valid), suitable for use
 * directly as a Formik / Final Form / vee-validate `validate` function.
 *
 * Synchronous unless any reachable validator returns a Promise, in which case
 * the whole call resolves asynchronously. Only the first issue per field is
 * surfaced; consumers that need nested paths or every issue should fall back
 * to `reachableFields` and call each field's Standard Schema validator directly.
 */
export function validateSchema<V extends object>(
  schema: SchemaBuilder<V>,
  values: Partial<V> | Record<string, unknown>,
): SchemaErrors<SchemaBuilder<V>> | Promise<SchemaErrors<SchemaBuilder<V>>> {
  const data = values as Record<string, unknown>
  const fields = reachableFields(schema, data)
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

  if (pending.length === 0) return errors as SchemaErrors<SchemaBuilder<V>>
  return Promise.all(pending).then(() => errors as SchemaErrors<SchemaBuilder<V>>)
}

/**
 * Build a single Standard Schema validator for a liveschema schema. Each
 * `validate(value)` call re-evaluates which fields are reachable given the
 * current `value`, then validates each reachable field against its own schema.
 *
 * Issues are tagged with the field's key as the first path segment, so
 * consumers that route errors by path (TanStack Form's `onDynamic`,
 * `@hookform/resolvers/standard-schema`, etc.) deliver each message to the
 * right field. Vendor is reported as `"liveschema"`.
 *
 * Input type is the flat, fully-optional view of `V` (same shape as
 * `FlatInferSchema<typeof schema>`) — a single record indexable by any
 * reachable field key, rather than the discriminated union of variant-partials
 * that `Partial<V>` collapses to. The validated output stays the precise
 * `V` for downstream narrowing.
 */
export function toStandardSchema<V extends object>(
  schema: SchemaBuilder<V>,
): StandardSchemaV1<FlatValue<V>, V> {
  return {
    '~standard': {
      version: 1,
      vendor: 'liveschema',
      validate(input) {
        const data = (input ?? {}) as Record<string, unknown>
        const fields = reachableFields(schema, data)
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

function walkSchemaNodes(
  nodes: SchemaNode[],
  values: Record<string, unknown>,
  out: SchemaField[],
): void {
  for (const node of nodes) {
    if (node.kind === 'field') {
      out.push({ key: node.key, schema: node.schema, value: values[node.key] })
    } else if (node.kind === 'whenEq') {
      const match = Object.entries(node.pattern).every(([k, v]) => values[k] === v)
      if (match) walkSchemaNodes(node.children, values, out)
    } else if (node.kind === 'whenAny') {
      const match = node.patterns.some((p) => Object.entries(p).every(([k, v]) => values[k] === v))
      if (match) walkSchemaNodes(node.children, values, out)
    } else {
      if (node.predicate(values)) walkSchemaNodes(node.children, values, out)
    }
  }
}

function walkAllNodes(
  nodes: SchemaNode[],
  values: Record<string, unknown>,
  pathReachable: boolean,
  out: DeclaredField[],
  seen: Map<string, number>,
): void {
  for (const node of nodes) {
    if (node.kind === 'field') {
      const existingIdx = seen.get(node.key)
      const entry: DeclaredField = {
        key: node.key,
        schema: node.schema,
        isReachable: pathReachable,
        value: values[node.key],
      }
      if (existingIdx === undefined) {
        seen.set(node.key, out.length)
        out.push(entry)
      } else if (pathReachable && !out[existingIdx].isReachable) {
        // Prefer the reachable occurrence's schema (different branches may declare
        // the same key with different validators / enum options).
        out[existingIdx] = entry
      }
    } else if (node.kind === 'whenEq') {
      const match = Object.entries(node.pattern).every(([k, v]) => values[k] === v)
      walkAllNodes(node.children, values, pathReachable && match, out, seen)
    } else if (node.kind === 'whenAny') {
      const match = node.patterns.some((p) => Object.entries(p).every(([k, v]) => values[k] === v))
      walkAllNodes(node.children, values, pathReachable && match, out, seen)
    } else {
      walkAllNodes(node.children, values, pathReachable && node.predicate(values), out, seen)
    }
  }
}
