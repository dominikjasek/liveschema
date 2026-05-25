import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { enumOptions } from './index'

describe('enumOptions', () => {
  test('returns the option list for a Zod string enum', () => {
    expect(enumOptions(z.enum(['a', 'b', 'c']))).toEqual(['a', 'b', 'c'])
  })

  test('returns undefined for a plain string schema', () => {
    expect(enumOptions(z.string())).toBeUndefined()
  })

  test('returns undefined for a boolean schema', () => {
    expect(enumOptions(z.boolean())).toBeUndefined()
  })

  test('returns undefined for a numeric schema', () => {
    expect(enumOptions(z.number())).toBeUndefined()
  })

  test('returns undefined for an object whose .options is not an array', () => {
    const fake = {
      '~standard': { version: 1, vendor: 'test', validate: (v: unknown) => ({ value: v }) },
      options: 'not-an-array',
    } as unknown as Parameters<typeof enumOptions>[0]
    expect(enumOptions(fake)).toBeUndefined()
  })

  test('returns undefined when options contains a non-string entry', () => {
    const fake = {
      '~standard': { version: 1, vendor: 'test', validate: (v: unknown) => ({ value: v }) },
      options: ['a', 1, 'b'],
    } as unknown as Parameters<typeof enumOptions>[0]
    expect(enumOptions(fake)).toBeUndefined()
  })

  test('returns undefined when options is an empty array — defensible either way, but the function returns the array as-is for empty', () => {
    // Documents the current contract: empty options arrays pass the all-strings
    // check and come back as an empty list, not undefined.
    const fake = {
      '~standard': { version: 1, vendor: 'test', validate: (v: unknown) => ({ value: v }) },
      options: [],
    } as unknown as Parameters<typeof enumOptions>[0]
    expect(enumOptions(fake)).toEqual([])
  })
})
