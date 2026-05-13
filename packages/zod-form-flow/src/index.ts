import { z } from 'zod'

export type Step = {
  field: string
  path: string
  schema: z.ZodType
  value: unknown
}

/**
 * Walk a Zod schema and produce the ordered list of user-facing steps
 * reachable from the current form values. The walker treats:
 *   - z.intersection           → walk left, then right
 *   - z.discriminatedUnion     → discriminator field is the next step; once
 *                                its value is set, descend into the matching
 *                                option's remaining fields
 *   - z.object                 → walk fields in declaration order; literal
 *                                fields (already determined) are skipped;
 *                                compound fields are recursed into
 *   - leaf field               → emitted as a step
 *
 * Compound z.object schemas tagged with `leafStep(...)` are emitted as a
 * single step instead of being recursed into.
 */
export function listSteps(schema: z.ZodType, values: unknown): Step[] {
  const out: Step[] = []
  walk(schema, values, [], out, values)
  return out
}

function walk(
  schema: z.ZodType,
  value: unknown,
  path: string[],
  out: Step[],
  rootValues: unknown,
): void {
  if (schema instanceof z.ZodIntersection) {
    const d = (schema as unknown as { def: { left: z.ZodType; right: z.ZodType } }).def
    walk(d.left, value, path, out, rootValues)
    walk(d.right, value, path, out, rootValues)
    return
  }

  if (schema instanceof z.ZodDiscriminatedUnion) {
    const d = (schema as unknown as {
      def: { discriminator: string; options: ReadonlyArray<z.ZodObject<z.ZodRawShape>> }
    }).def
    const disc = d.discriminator
    const options = d.options
    const allowed = options.map((o) => literalValueOf(o.shape[disc])) as string[]
    out.push({
      field: disc,
      path: [...path, disc].join('.'),
      schema: z.enum(allowed as [string, ...string[]]),
      value: getAt(value, disc),
    })
    const v = getAt(value, disc)
    if (v === undefined) return
    const matched = options.find((o) => literalValueOf(o.shape[disc]) === v)
    if (matched) walkObject(matched, value, path, out, rootValues, disc)
    return
  }

  if (schema instanceof z.ZodObject) {
    walkObject(schema as z.ZodObject<z.ZodRawShape>, value, path, out, rootValues)
    return
  }
}

function walkObject(
  obj: z.ZodObject<z.ZodRawShape>,
  value: unknown,
  path: string[],
  out: Step[],
  rootValues: unknown,
  skipKey?: string,
): void {
  for (const [key, fieldSchema] of Object.entries(obj.shape)) {
    if (skipKey && key === skipKey) continue
    const pred = getConditionalPredicate(fieldSchema)
    if (pred && !pred(value, rootValues)) continue
    if (fieldSchema instanceof z.ZodLiteral) {
      if (literalValueOf(fieldSchema) === true) {
        out.push({
          field: key,
          path: [...path, key].join('.'),
          schema: fieldSchema,
          value: getAt(value, key),
        })
      }
      continue
    }
    if (isLeafStep(fieldSchema)) {
      out.push({
        field: key,
        path: [...path, key].join('.'),
        schema: fieldSchema as z.ZodType,
        value: getAt(value, key),
      })
    } else if (
      fieldSchema instanceof z.ZodObject ||
      fieldSchema instanceof z.ZodDiscriminatedUnion ||
      fieldSchema instanceof z.ZodIntersection
    ) {
      walk(fieldSchema as z.ZodType, getAt(value, key), [...path, key], out, rootValues)
    } else {
      out.push({
        field: key,
        path: [...path, key].join('.'),
        schema: fieldSchema as z.ZodType,
        value: getAt(value, key),
      })
    }
  }
}

function literalValueOf(schema: unknown): unknown {
  const v = schema as { value?: unknown; def?: { values?: unknown[] } }
  if ('value' in v && v.value !== undefined) return v.value
  return v.def?.values?.[0]
}

function getAt(obj: unknown, key: string): unknown {
  if (obj === null || typeof obj !== 'object') return undefined
  return (obj as Record<string, unknown>)[key]
}

/** Wrap a leaf schema with the nested-object structure implied by a dotted path. */
export function schemaAtPath(path: string, leaf: z.ZodType): z.ZodType {
  const parts = path.split('.')
  let acc: z.ZodType = leaf
  for (let i = parts.length - 1; i >= 0; i--) {
    acc = z.object({ [parts[i]]: acc })
  }
  return acc
}

// ---------------------------------------------------------------------------
// Leaf-step marker. The walker normally descends into compound z.objects; tag
// a compound with `leafStep(...)` and the walker emits it whole instead.
// ---------------------------------------------------------------------------

const leafStepRegistry = new WeakSet<object>()

export function leafStep<T extends z.ZodType>(schema: T): T {
  leafStepRegistry.add(schema as unknown as object)
  return schema
}

export function isLeafStep(schema: unknown): boolean {
  return typeof schema === 'object' && schema !== null && leafStepRegistry.has(schema)
}

// ---------------------------------------------------------------------------
// Conditional-step marker. Tag a sub-schema with `conditionalStep(pred, ...)`
// and the walker skips it (emits no steps) whenever the predicate returns
// false. The predicate receives `(localValues, rootValues)` — localValues is
// the parent object's current value, rootValues is the full form values.
// Validation of the wrapped schema is the caller's responsibility (e.g. mark
// inner fields `.optional()` if they should not be required when skipped).
// ---------------------------------------------------------------------------

type ConditionalPredicate<L = unknown, R = unknown> = (localValues: L, rootValues: R) => boolean

const conditionalRegistry = new WeakMap<object, ConditionalPredicate>()

export function conditionalStep<T extends z.ZodType, L = unknown, R = unknown>(
  predicate: ConditionalPredicate<L, R>,
  schema: T,
): T {
  conditionalRegistry.set(schema as unknown as object, predicate as ConditionalPredicate)
  return schema
}

export function getConditionalPredicate(schema: unknown): ConditionalPredicate | undefined {
  if (typeof schema !== 'object' || schema === null) return undefined
  return conditionalRegistry.get(schema)
}

/**
 * Typed `z.object` builder. Splits the object into `core` fields (the always-
 * present base) and an `extend` callback that produces additional fields,
 * some of which can be wrapped in `when(predicate, schema)` to be gated by
 * the walker. Inside the callback, `when`'s predicate receives a `local`
 * value typed from the inferred shape of `core` (merged with `Parent` if
 * `.withParent(...)` was called), so no manual annotation is needed.
 */
export function objectWith<Core extends z.ZodRawShape>(core: Core) {
  return makeObjectWithBuilder<Core, object>(core)
}

function makeObjectWithBuilder<Core extends z.ZodRawShape, Parent extends object>(
  core: Core,
) {
  type Local = Partial<Parent & z.infer<z.ZodObject<Core>>>
  type WhenFn = <T extends z.ZodType>(
    predicate: (local: Local, root: unknown) => boolean,
    schema: T,
  ) => T

  const when: WhenFn = (predicate, schema) => {
    conditionalRegistry.set(
      schema as unknown as object,
      predicate as unknown as ConditionalPredicate,
    )
    return schema
  }

  return {
    /**
     * Declare the type of the surrounding parent value (e.g. fields lifted
     * into an outer `z.intersection`). The runtime value passed to the
     * predicate already includes parent fields — this call only adds them to
     * the inferred `local` type. The schema argument is used type-only.
     */
    withParent<P extends z.ZodType>(_parent: P) {
      return makeObjectWithBuilder<Core, z.infer<P> & object>(core)
    },
    extend<Extra extends z.ZodRawShape>(
      build: (when: WhenFn) => Extra,
    ): z.ZodObject<Core & Extra> {
      const extra = build(when)
      return z.object({ ...core, ...extra }) as unknown as z.ZodObject<Core & Extra>
    },
  }
}

// ---------------------------------------------------------------------------
// defineForm — high-level builder DSL. Zod is used only for terminal leaf
// validators; structure (sequencing, equality branches, predicate gates) is
// expressed via .ask() and .when(). The resulting value shape is flat — no
// synthetic wrapper keys, no z.literal discriminators, no z.intersection
// gymnastics in user code.
// ---------------------------------------------------------------------------

type FormNode =
  | { kind: 'ask'; key: string; schema: z.ZodType }
  | {
      kind: 'whenEq'
      pattern: Record<string, unknown>
      children: FormNode[]
    }
  | {
      kind: 'whenPred'
      predicate: (values: Record<string, unknown>) => boolean
      children: FormNode[]
    }

const FORM_NODES = Symbol('zod-form-flow.formNodes')

type Prettify<T> = { [K in keyof T]: T[K] } & {}

export type FormBuilder<V extends object = object> = {
  ask<K extends string, S extends z.ZodType>(
    key: K,
    schema: S,
  ): FormBuilder<Prettify<V & { [P in K]: z.infer<S> }>>

  when<const P extends Partial<V>>(
    pattern: P,
    branch: (b: FormBuilder<Prettify<V & P>>) => FormBuilder<object>,
  ): FormBuilder<V>

  when(
    predicate: (values: Partial<V>) => boolean,
    branch: (b: FormBuilder<V>) => FormBuilder<object>,
  ): FormBuilder<V>

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
    ask(key: string, schema: z.ZodType) {
      return makeFormBuilder([...nodes, { kind: 'ask', key, schema }])
    },
    when(
      patternOrPred: unknown,
      branchFn: (b: FormBuilder<object>) => FormBuilder<object>,
    ) {
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
  } as unknown as FormBuilder<object>
  return builder
}

export type FormStep = {
  key: string
  schema: z.ZodType
  value: unknown
}

/** Ordered list of currently-reachable steps given the current values. */
export function listFormSteps(
  form: FormBuilder<object>,
  values: Record<string, unknown>,
): FormStep[] {
  const out: FormStep[] = []
  walkFormNodes(form[FORM_NODES], values, out)
  return out
}

/** Set of keys reachable in the current state — useful for pruning orphans. */
export function reachableKeys(
  form: FormBuilder<object>,
  values: Record<string, unknown>,
): Set<string> {
  return new Set(listFormSteps(form, values).map((s) => s.key))
}

function walkFormNodes(
  nodes: FormNode[],
  values: Record<string, unknown>,
  out: FormStep[],
): void {
  for (const node of nodes) {
    if (node.kind === 'ask') {
      out.push({ key: node.key, schema: node.schema, value: values[node.key] })
    } else if (node.kind === 'whenEq') {
      const match = Object.entries(node.pattern).every(([k, v]) => values[k] === v)
      if (match) walkFormNodes(node.children, values, out)
    } else {
      if (node.predicate(values)) walkFormNodes(node.children, values, out)
    }
  }
}
