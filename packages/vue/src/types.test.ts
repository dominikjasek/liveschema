import { describe, expectTypeOf, test } from 'vitest'
import { z } from 'zod'
import type { ComputedRef } from 'vue'
import { defineSchema } from '@liveschema/core'
import type { LiveSchemaField, LiveSchemaFieldFor, UseLiveSchemaResult } from './index'

// A representative schema that mixes every leaf shape the composable needs to type:
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
// Unwrap ComputedRef<T> to T for per-key assertions.
type FieldsValue = Result['fields'] extends ComputedRef<infer U> ? U : never
type ReachableFieldsValue = Result['reachableFields'] extends ComputedRef<infer U> ? U : never

describe('useLiveSchema return types — fields ComputedRef', () => {
  test('non-enum fields expose only `isReachable` (no enumOptions on the record entry)', () => {
    expectTypeOf<FieldsValue['email']>().toEqualTypeOf<{ isReachable: boolean }>()
    expectTypeOf<FieldsValue['agreed']>().toEqualTypeOf<{ isReachable: boolean }>()
    expectTypeOf<FieldsValue['age']>().toEqualTypeOf<{ isReachable: boolean }>()
  })

  test('enum fields carry `enumOptions?` narrowed to the schema literals', () => {
    expectTypeOf<FieldsValue['orderType']>().toEqualTypeOf<{
      isReachable: boolean
      enumOptions?: readonly ('pickup' | 'delivery')[]
    }>()

    expectTypeOf<FieldsValue['mainCourse']>().toEqualTypeOf<{
      isReachable: boolean
      enumOptions?: readonly ('pizza' | 'salad')[]
    }>()
  })

  test('enum fields declared inside a branch are still narrowed', () => {
    expectTypeOf<FieldsValue['size']>().toEqualTypeOf<{
      isReachable: boolean
      enumOptions?: readonly ('s' | 'm' | 'l')[]
    }>()
  })

  test('accessing `.enumOptions` on a non-enum entry is a compile error', () => {
    // @ts-expect-error — `email` is a wide string, the type intentionally omits `enumOptions`.
    type _A = FieldsValue['email']['enumOptions']
    // @ts-expect-error — `agreed` is boolean.
    type _B = FieldsValue['agreed']['enumOptions']
    // @ts-expect-error — `age` is number.
    type _C = FieldsValue['age']['enumOptions']
    expectTypeOf<FieldsValue['email']>().not.toHaveProperty('enumOptions')
    expectTypeOf<FieldsValue['agreed']>().not.toHaveProperty('enumOptions')
    expectTypeOf<FieldsValue['age']>().not.toHaveProperty('enumOptions')
  })

  test('every per-key entry is assignable to the open-ended LiveSchemaField supertype', () => {
    expectTypeOf<FieldsValue['email']>().toMatchTypeOf<LiveSchemaField>()
    expectTypeOf<FieldsValue['orderType']>().toMatchTypeOf<LiveSchemaField>()
  })
})

describe('useLiveSchema return types — reachableFields ComputedRef', () => {
  test('reachableFields is the Partial of fields — unreachable keys may be absent', () => {
    expectTypeOf<ReachableFieldsValue>().toEqualTypeOf<Partial<FieldsValue>>()
  })

  test('looked-up entries carry the same per-key shape but may be undefined', () => {
    expectTypeOf<ReachableFieldsValue['email']>().toEqualTypeOf<
      { isReachable: boolean } | undefined
    >()
    expectTypeOf<ReachableFieldsValue['orderType']>().toEqualTypeOf<
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
