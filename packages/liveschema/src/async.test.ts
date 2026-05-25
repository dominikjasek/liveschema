import { describe, expect, test } from 'vitest'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import { z } from 'zod'
import { defineSchema, toStandardSchema, validateSchema } from './index'

/**
 * Builds a Standard Schema leaf that returns a Promise — used to force
 * validateSchema / toStandardSchema down the async code path so we can assert
 * the Promise-aware branches in walkers and finalize().
 */
function asyncStringMin(min: number): StandardSchemaV1<string> {
  return {
    '~standard': {
      version: 1,
      vendor: 'test',
      async validate(input) {
        await Promise.resolve()
        if (typeof input !== 'string') {
          return { issues: [{ message: 'expected string' }] }
        }
        if (input.length < min) {
          return { issues: [{ message: `min length is ${min}` }] }
        }
        return { value: input }
      },
    },
  }
}

describe('validateSchema async path', () => {
  const schema = defineSchema().field('email', z.string()).field('async', asyncStringMin(3))

  test('returns a Promise when any active validator is async', async () => {
    const result = validateSchema(schema, { email: 'a', async: 'x' })
    expect(result).toBeInstanceOf(Promise)
    const errors = await result
    expect(errors).toMatchObject({ async: expect.stringMatching(/min length/) })
  })

  test('resolves to an empty object when every async validator passes', async () => {
    const errors = await validateSchema(schema, { email: 'a', async: 'long-enough' })
    expect(errors).toEqual({})
  })

  test('stays synchronous when no async validator is active', () => {
    const partial = defineSchema().field('email', z.string()) // no async leaf
    const result = validateSchema(partial, { email: 'a' })
    expect(result).not.toBeInstanceOf(Promise)
  })
})

describe('toStandardSchema async path', () => {
  const schema = defineSchema().field('email', z.string()).field('async', asyncStringMin(3))

  test('produces a Standard Schema whose validate() resolves to a value when all leaves pass', async () => {
    const ss = toStandardSchema(schema)
    const result = await ss['~standard'].validate({ email: 'a@b.co', async: 'long-enough' })
    expect('value' in result && result.value).toEqual({ email: 'a@b.co', async: 'long-enough' })
  })

  test('aggregates issues from async leaves into the issues array', async () => {
    const ss = toStandardSchema(schema)
    const result = await ss['~standard'].validate({ email: 'a@b.co', async: 'xx' })
    expect('issues' in result && result.issues).toBeTruthy()
    const messages = ('issues' in result ? result.issues : [])?.map((i) => i.message)
    expect(messages).toContain('min length is 3')
  })

  test('tags async issues with the field key as the first path segment', async () => {
    const ss = toStandardSchema(schema)
    const result = await ss['~standard'].validate({ email: 'a@b.co', async: 'xx' })
    if (!('issues' in result) || !result.issues) throw new Error('expected issues')
    const issue = result.issues.find((i) => i.message === 'min length is 3')
    expect(issue?.path).toEqual(['async'])
  })
})
