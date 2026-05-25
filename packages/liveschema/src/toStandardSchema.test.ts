import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { defineSchema, toStandardSchema } from './index'

describe('toStandardSchema', () => {
  test('vendor identifies as liveschema', () => {
    const ss = toStandardSchema(defineSchema().field('a', z.string()))
    expect(ss['~standard'].vendor).toBe('liveschema')
    expect(ss['~standard'].version).toBe(1)
  })

  test('strips values from branches that are not currently active', () => {
    const schema = defineSchema()
      .field('orderType', z.enum(['pickup', 'delivery']))
      .when({ orderType: 'delivery' }, (b) => b.field('leaveAtDoor', z.boolean()))

    const ss = toStandardSchema(schema)
    const result = ss['~standard'].validate({ orderType: 'pickup', leaveAtDoor: true })
    if (result instanceof Promise) throw new Error('expected sync result')
    expect('value' in result && result.value).toEqual({ orderType: 'pickup' })
  })

  test('treats undefined input as an empty object', () => {
    const schema = defineSchema().field('a', z.string().optional())
    const ss = toStandardSchema(schema)
    const result = ss['~standard'].validate(undefined)
    if (result instanceof Promise) throw new Error('expected sync result')
    expect('issues' in result && result.issues).toBeFalsy()
  })

  test('tags issues with the field key as the first path segment', () => {
    const schema = defineSchema().field('email', z.string().min(5))
    const ss = toStandardSchema(schema)
    const result = ss['~standard'].validate({ email: 'a' })
    if (result instanceof Promise) throw new Error('expected sync result')
    if (!('issues' in result) || !result.issues) throw new Error('expected issues')
    expect(result.issues[0].path?.[0]).toBe('email')
  })

  test('preserves coerced output values', () => {
    const schema = defineSchema().field('count', z.coerce.number().int())
    const ss = toStandardSchema(schema)
    const result = ss['~standard'].validate({ count: '7' })
    if (result instanceof Promise) throw new Error('expected sync result')
    expect('value' in result && result.value).toEqual({ count: 7 })
  })

  test('reports issues from multiple active fields in one pass', () => {
    const schema = defineSchema().field('a', z.string().min(5)).field('b', z.string().min(5))

    const ss = toStandardSchema(schema)
    const result = ss['~standard'].validate({ a: 'x', b: 'y' })
    if (result instanceof Promise) throw new Error('expected sync result')
    if (!('issues' in result) || !result.issues) throw new Error('expected issues')
    const paths = result.issues.map((i) => i.path?.[0])
    expect(paths).toContain('a')
    expect(paths).toContain('b')
  })
})
