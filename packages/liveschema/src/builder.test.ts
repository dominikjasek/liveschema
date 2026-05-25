import { describe, expect, expectTypeOf, test } from 'vitest'
import { z } from 'zod'
import {
  activeFields,
  declaredFields,
  defineSchema,
  type InferSchema,
  type SchemaKeys,
} from './index'

describe('builder — defineSchema', () => {
  test('produces an empty active-field list for a schema with no .field calls', () => {
    const empty = defineSchema()
    expect(activeFields(empty, {})).toEqual([])
    expect(declaredFields(empty, {})).toEqual([])
  })

  test('preserves field declaration order in the output', () => {
    const schema = defineSchema()
      .field('b', z.string())
      .field('a', z.string())
      .field('c', z.string())
    expect(activeFields(schema, {}).map((f) => f.key)).toEqual(['b', 'a', 'c'])
  })

  test('is immutable — chaining returns a new builder without mutating the previous one', () => {
    const base = defineSchema().field('a', z.string())
    const extended = base.field('b', z.string())

    expect(activeFields(base, {}).map((f) => f.key)).toEqual(['a'])
    expect(activeFields(extended, {}).map((f) => f.key)).toEqual(['a', 'b'])
  })

  test('threads field values through to the active-fields output', () => {
    const schema = defineSchema().field('email', z.string()).field('count', z.number())
    const fields = activeFields(schema, { email: 'a@b.co', count: 5 })
    expect(fields.find((f) => f.key === 'email')?.value).toBe('a@b.co')
    expect(fields.find((f) => f.key === 'count')?.value).toBe(5)
  })

  test('keeps each field carrying its own Standard Schema validator', () => {
    const schema = defineSchema().field('email', z.email())
    const f = activeFields(schema, { email: 'not-an-email' })[0]
    const result = f.schema['~standard'].validate('not-an-email')
    if (result instanceof Promise) throw new Error('expected sync')
    expect(result.issues).toBeTruthy()
  })
})

describe('builder — type inference', () => {
  test('infers a flat value type for an unconditional schema', () => {
    const _schema = defineSchema().field('email', z.string()).field('count', z.number())
    type V = InferSchema<typeof _schema>
    expectTypeOf<V>().toEqualTypeOf<{ email: string; count: number }>()
  })

  test('exposes all keys via SchemaKeys', () => {
    const _schema = defineSchema().field('a', z.string()).field('b', z.number())
    expectTypeOf<SchemaKeys<typeof _schema>>().toEqualTypeOf<'a' | 'b'>()
  })

  test('SchemaKeys yields the union of every variant key for branching schemas', () => {
    const _schema = defineSchema()
      .field('mode', z.enum(['x', 'y']))
      .when({ mode: 'x' }, (b) => b.field('xOnly', z.string()))
      .when({ mode: 'y' }, (b) => b.field('yOnly', z.string()))

    expectTypeOf<SchemaKeys<typeof _schema>>().toEqualTypeOf<'mode' | 'xOnly' | 'yOnly'>()
  })
})
