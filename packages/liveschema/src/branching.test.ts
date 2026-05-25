import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { activeFields, defineSchema, validateSchema } from './index'

describe('whenEq — equality branches', () => {
  const schema = defineSchema()
    .field('orderType', z.enum(['pickup', 'delivery']))
    .when({ orderType: 'delivery' }, (b) => b.field('address', z.string().min(1)))

  test('reveals the branch only when the discriminator matches', () => {
    const pickup = activeFields(schema, { orderType: 'pickup' }).map((f) => f.key)
    expect(pickup).toEqual(['orderType'])

    const delivery = activeFields(schema, { orderType: 'delivery' }).map((f) => f.key)
    expect(delivery).toEqual(['orderType', 'address'])
  })

  test('does not fire when the discriminator is unset', () => {
    const keys = activeFields(schema, {}).map((f) => f.key)
    expect(keys).toEqual(['orderType'])
  })

  test('requires every key in the pattern to equal its literal', () => {
    const schemaMulti = defineSchema()
      .field('a', z.string())
      .field('b', z.string())
      .when({ a: 'x', b: 'y' }, (b) => b.field('c', z.string()))

    expect(activeFields(schemaMulti, { a: 'x', b: 'y' }).map((f) => f.key)).toContain('c')
    expect(activeFields(schemaMulti, { a: 'x', b: 'z' }).map((f) => f.key)).not.toContain('c')
    expect(activeFields(schemaMulti, { a: 'other', b: 'y' }).map((f) => f.key)).not.toContain('c')
  })
})

describe('whenAny — union of patterns', () => {
  const schema = defineSchema()
    .field('orderType', z.enum(['pickup', 'delivery']))
    .field('mainCourse', z.enum(['pizza', 'salad']))
    .whenAny([{ orderType: 'delivery' }, { mainCourse: 'pizza' }], (b) =>
      b.field('needsNapkins', z.boolean()),
    )

  test('fires when the first pattern matches', () => {
    const keys = activeFields(schema, { orderType: 'delivery', mainCourse: 'salad' }).map(
      (f) => f.key,
    )
    expect(keys).toContain('needsNapkins')
  })

  test('fires when only the second pattern matches', () => {
    const keys = activeFields(schema, { orderType: 'pickup', mainCourse: 'pizza' }).map(
      (f) => f.key,
    )
    expect(keys).toContain('needsNapkins')
  })

  test('fires when both patterns match (single emission)', () => {
    const keys = activeFields(schema, { orderType: 'delivery', mainCourse: 'pizza' }).map(
      (f) => f.key,
    )
    expect(keys.filter((k) => k === 'needsNapkins')).toEqual(['needsNapkins'])
  })

  test('does not fire when no pattern matches', () => {
    const keys = activeFields(schema, { orderType: 'pickup', mainCourse: 'salad' }).map(
      (f) => f.key,
    )
    expect(keys).not.toContain('needsNapkins')
  })
})

describe('whenPred — predicate branches', () => {
  const schema = defineSchema()
    .field('pizzaCount', z.coerce.number().int().min(1).max(20))
    .when(
      (v) => Number(v.pizzaCount) >= 3,
      (b) => b.field('requestedReadyTime', z.string().min(1)),
    )

  test('reveals the branch when the predicate returns truthy', () => {
    const keys = activeFields(schema, { pizzaCount: 3 }).map((f) => f.key)
    expect(keys).toEqual(['pizzaCount', 'requestedReadyTime'])
  })

  test('hides the branch when the predicate returns falsy', () => {
    const keys = activeFields(schema, { pizzaCount: 1 }).map((f) => f.key)
    expect(keys).toEqual(['pizzaCount'])
  })

  test('predicate receives the raw values verbatim — no coercion before the call', () => {
    const seen: unknown[] = []
    const trackingSchema = defineSchema()
      .field('flag', z.string())
      .when(
        (v) => {
          seen.push(v.flag)
          return v.flag === 'on'
        },
        (b) => b.field('extra', z.string()),
      )
    activeFields(trackingSchema, { flag: 'off' })
    activeFields(trackingSchema, { flag: 'on' })
    expect(seen).toEqual(['off', 'on'])
  })
})

describe('nested branches', () => {
  const schema = defineSchema()
    .field('a', z.enum(['x', 'y']))
    .when({ a: 'x' }, (b) =>
      b.field('b', z.enum(['p', 'q'])).when({ b: 'p' }, (b) => b.field('c', z.string())),
    )

  test('inner branches stay gated by the outer branch', () => {
    // Outer matches, inner matches → both reveal
    expect(activeFields(schema, { a: 'x', b: 'p' }).map((f) => f.key)).toEqual(['a', 'b', 'c'])
    // Outer matches, inner doesn't → only outer + b
    expect(activeFields(schema, { a: 'x', b: 'q' }).map((f) => f.key)).toEqual(['a', 'b'])
    // Outer doesn't match → inner is unreachable regardless of `b`
    expect(activeFields(schema, { a: 'y', b: 'p' }).map((f) => f.key)).toEqual(['a'])
  })
})

describe('whenEq + whenPred combined', () => {
  const schema = defineSchema()
    .field('mainCourse', z.enum(['pizza', 'salad']))
    .when({ mainCourse: 'pizza' }, (b) =>
      b.field('pizzaCount', z.coerce.number()).when(
        (v) => Number(v.pizzaCount) >= 3,
        (b) => b.field('readyTime', z.string()),
      ),
    )

  test('inner predicate fires only inside the matching outer branch', () => {
    expect(activeFields(schema, { mainCourse: 'pizza', pizzaCount: 4 }).map((f) => f.key)).toEqual([
      'mainCourse',
      'pizzaCount',
      'readyTime',
    ])
    expect(activeFields(schema, { mainCourse: 'pizza', pizzaCount: 1 }).map((f) => f.key)).toEqual([
      'mainCourse',
      'pizzaCount',
    ])
    expect(
      activeFields(schema, { mainCourse: 'salad', pizzaCount: 999 }).map((f) => f.key),
    ).toEqual(['mainCourse'])
  })
})

describe('validateSchema with branching', () => {
  const schema = defineSchema()
    .field('orderType', z.enum(['pickup', 'delivery']))
    .when({ orderType: 'delivery' }, (b) => b.field('address', z.string().min(5)))

  test('only validates fields in the active branch', () => {
    // address is required-by-zod but inactive → no error reported
    const errors = validateSchema(schema, { orderType: 'pickup' })
    expect(errors).toEqual({})
  })

  test('reports errors for active branch fields', () => {
    const errors = validateSchema(schema, { orderType: 'delivery', address: 'x' })
    expect(errors).toMatchObject({ address: expect.any(String) })
  })
})
