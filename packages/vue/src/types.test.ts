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
type ActiveFieldsValue = Result['activeFields'] extends ComputedRef<infer U> ? U : never

describe('useLiveSchema return types — fields ComputedRef', () => {
  test('non-enum fields expose only `isActive` (no enumOptions on the record entry)', () => {
    expectTypeOf<FieldsValue['email']>().toEqualTypeOf<{ isActive: boolean }>()
    expectTypeOf<FieldsValue['agreed']>().toEqualTypeOf<{ isActive: boolean }>()
    expectTypeOf<FieldsValue['age']>().toEqualTypeOf<{ isActive: boolean }>()
  })

  test('enum fields carry `enumOptions?` narrowed to the schema literals', () => {
    expectTypeOf<FieldsValue['orderType']>().toEqualTypeOf<{
      isActive: boolean
      enumOptions?: readonly ('pickup' | 'delivery')[]
    }>()

    expectTypeOf<FieldsValue['mainCourse']>().toEqualTypeOf<{
      isActive: boolean
      enumOptions?: readonly ('pizza' | 'salad')[]
    }>()
  })

  test('enum fields declared inside a branch are still narrowed', () => {
    expectTypeOf<FieldsValue['size']>().toEqualTypeOf<{
      isActive: boolean
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

describe('useLiveSchema return types — activeFields ComputedRef', () => {
  test('activeFields is the Partial of fields — inactive keys may be absent', () => {
    expectTypeOf<ActiveFieldsValue>().toEqualTypeOf<Partial<FieldsValue>>()
  })

  test('looked-up entries carry the same per-key shape but may be undefined', () => {
    expectTypeOf<ActiveFieldsValue['email']>().toEqualTypeOf<{ isActive: boolean } | undefined>()
    expectTypeOf<ActiveFieldsValue['orderType']>().toEqualTypeOf<
      { isActive: boolean; enumOptions?: readonly ('pickup' | 'delivery')[] } | undefined
    >()
  })
})

describe('useLiveSchema return types — isActiveField', () => {
  test('only accepts keys declared in the schema', () => {
    expectTypeOf<Result['isActiveField']>()
      .parameter(0)
      .toEqualTypeOf<'email' | 'age' | 'agreed' | 'orderType' | 'mainCourse' | 'size'>()
  })
})

describe('LiveSchemaFieldFor<T> helper', () => {
  test('non-enum types produce `{ isActive }` only', () => {
    expectTypeOf<LiveSchemaFieldFor<boolean>>().toEqualTypeOf<{ isActive: boolean }>()
    expectTypeOf<LiveSchemaFieldFor<number>>().toEqualTypeOf<{ isActive: boolean }>()
    expectTypeOf<LiveSchemaFieldFor<string>>().toEqualTypeOf<{ isActive: boolean }>()
    expectTypeOf<LiveSchemaFieldFor<Date>>().toEqualTypeOf<{ isActive: boolean }>()
  })

  test('literal string unions produce `enumOptions?` narrowed to the union', () => {
    expectTypeOf<LiveSchemaFieldFor<'a' | 'b'>>().toEqualTypeOf<{
      isActive: boolean
      enumOptions?: readonly ('a' | 'b')[]
    }>()
  })

  test('optional literal unions (T | undefined) still produce enumOptions', () => {
    expectTypeOf<LiveSchemaFieldFor<'a' | 'b' | undefined>>().toEqualTypeOf<{
      isActive: boolean
      enumOptions?: readonly ('a' | 'b')[]
    }>()
  })
})
