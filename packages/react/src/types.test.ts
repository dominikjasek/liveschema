import { describe, expectTypeOf, test } from 'vitest'
import { z } from 'zod'
import { defineSchema } from '@liveschema/core'
import type { LiveSchemaField, LiveSchemaFieldFor, UseLiveSchemaResult } from './index'

// A representative schema that mixes every leaf shape the hook needs to type:
// - wide string / boolean / number → non-enum (no enumOptions on the entry)
// - z.enum(...)                    → enum-like (enumOptions typed to the literals)
// - z.enum inside a branch         → still enum-like
const _schema = defineSchema()
  .field('email', z.string())
  .field('age', z.number())
  .field('agreed', z.boolean())
  .field('orderType', z.enum(['pickup', 'delivery']))
  .field('mainCourse', z.enum(['pizza', 'salad']))
  .when({ mainCourse: 'pizza' }, (b) => b.field('size', z.enum(['s', 'm', 'l'])))

type Result = UseLiveSchemaResult<typeof _schema>
type Fields = Result['fields']
type ReachableFields = Result['reachableFields']

describe('useLiveSchema return types — fields record', () => {
  test('non-enum fields expose only `isReachable` (no enumOptions on the record entry)', () => {
    expectTypeOf<Fields['email']>().toEqualTypeOf<{ isReachable: boolean }>()
    expectTypeOf<Fields['agreed']>().toEqualTypeOf<{ isReachable: boolean }>()
    expectTypeOf<Fields['age']>().toEqualTypeOf<{ isReachable: boolean }>()
  })

  test('enum fields carry `enumOptions?` narrowed to the schema literals', () => {
    expectTypeOf<Fields['orderType']>().toEqualTypeOf<{
      isReachable: boolean
      enumOptions?: readonly ('pickup' | 'delivery')[]
    }>()

    expectTypeOf<Fields['mainCourse']>().toEqualTypeOf<{
      isReachable: boolean
      enumOptions?: readonly ('pizza' | 'salad')[]
    }>()
  })

  test('enum fields declared inside a branch are still narrowed', () => {
    expectTypeOf<Fields['size']>().toEqualTypeOf<{
      isReachable: boolean
      enumOptions?: readonly ('s' | 'm' | 'l')[]
    }>()
  })

  test('accessing `.enumOptions` on a non-enum entry is a compile error', () => {
    // @ts-expect-error — `email` is a wide string, the type intentionally omits `enumOptions`.
    type _A = Fields['email']['enumOptions']
    // @ts-expect-error — `agreed` is boolean.
    type _B = Fields['agreed']['enumOptions']
    // @ts-expect-error — `age` is number.
    type _C = Fields['age']['enumOptions']
    // No-op runtime body — assertions are checked at compile time.
    expectTypeOf<Fields['email']>().not.toHaveProperty('enumOptions')
    expectTypeOf<Fields['agreed']>().not.toHaveProperty('enumOptions')
    expectTypeOf<Fields['age']>().not.toHaveProperty('enumOptions')
  })

  test('every per-key entry is assignable to the open-ended LiveSchemaField supertype', () => {
    expectTypeOf<Fields['email']>().toMatchTypeOf<LiveSchemaField>()
    expectTypeOf<Fields['orderType']>().toMatchTypeOf<LiveSchemaField>()
  })
})

describe('useLiveSchema return types — reachableFields record', () => {
  test('reachableFields is the Partial of fields — unreachable keys may be absent', () => {
    expectTypeOf<ReachableFields>().toEqualTypeOf<Partial<Fields>>()
  })

  test('looked-up entries carry the same per-key shape but may be undefined', () => {
    expectTypeOf<ReachableFields['email']>().toEqualTypeOf<{ isReachable: boolean } | undefined>()
    expectTypeOf<ReachableFields['orderType']>().toEqualTypeOf<
      { isReachable: boolean; enumOptions?: readonly ('pickup' | 'delivery')[] } | undefined
    >()
  })
})

describe('useLiveSchema return types — isReachableField', () => {
  test('only accepts keys declared in the schema', () => {
    expectTypeOf<Result['isReachableField']>()
      .parameter(0)
      .toEqualTypeOf<'email' | 'age' | 'agreed' | 'orderType' | 'mainCourse' | 'size'>()
  })
})

describe('LiveSchemaFieldFor<T> helper', () => {
  test('non-enum types produce `{ isReachable }` only', () => {
    expectTypeOf<LiveSchemaFieldFor<boolean>>().toEqualTypeOf<{ isReachable: boolean }>()
    expectTypeOf<LiveSchemaFieldFor<number>>().toEqualTypeOf<{ isReachable: boolean }>()
    expectTypeOf<LiveSchemaFieldFor<string>>().toEqualTypeOf<{ isReachable: boolean }>()
    expectTypeOf<LiveSchemaFieldFor<Date>>().toEqualTypeOf<{ isReachable: boolean }>()
  })

  test('literal string unions produce `enumOptions?` narrowed to the union', () => {
    expectTypeOf<LiveSchemaFieldFor<'a' | 'b'>>().toEqualTypeOf<{
      isReachable: boolean
      enumOptions?: readonly ('a' | 'b')[]
    }>()
  })

  test('optional literal unions (T | undefined) still produce enumOptions', () => {
    expectTypeOf<LiveSchemaFieldFor<'a' | 'b' | undefined>>().toEqualTypeOf<{
      isReachable: boolean
      enumOptions?: readonly ('a' | 'b')[]
    }>()
  })
})

// =========================================================================
// Regression: a predicate-form `.when((v) => …, b => b.field('k', enum))`
// adds `k` as an optional property in every variant of the inferred value
// type. `InferField` used to use `V extends Record<K, infer T>`, which
// can't infer `T` through an optional property — collapsing the result to
// `never` (and `LiveSchemaFieldFor<never>` → no `enumOptions` exposed).
// The minimum ingredients to reproduce: a discriminated-union value type
// (so `InferSchema` has multiple variants) plus a predicate-form `.when()`
// that adds an enum field. The fix switched `InferField` to `K extends
// keyof V ? V[K] : never`, which handles optional uniformly.
// =========================================================================

const _repro = defineSchema()
  .field('kind', z.enum(['a', 'b']))
  .field('isForFree', z.boolean())
  .when({ kind: 'a' }, (b) => b.field('extraA', z.string()))
  .when({ kind: 'b' }, (b) => b.field('extraB', z.string()))
  .when(
    (v) => !v.isForFree,
    (b) => b.field('paymentMethod', z.enum(['invoice'])),
  )

type ReproFields = UseLiveSchemaResult<typeof _repro>['fields']

describe('regression — predicate-form .when() over a discriminated union', () => {
  test('field added by predicate-form .when() still exposes enumOptions', () => {
    expectTypeOf<ReproFields['paymentMethod']>().toHaveProperty('enumOptions')
  })
})
