import { describe, expect, test } from 'vitest'
import { z } from 'zod'
import { declaredFields, defineSchema } from './index'

describe('declaredFields', () => {
  test('returns every field, marking unreachable ones isActive: false', () => {
    const schema = defineSchema()
      .field('email', z.string())
      .field('orderType', z.enum(['pickup', 'delivery']))
      .when({ orderType: 'delivery' }, (b) => b.field('leaveAtDoor', z.boolean()))
      .field('mainCourse', z.enum(['pizza', 'salad']))
      .when({ mainCourse: 'pizza' }, (b) => b.field('pizzaCount', z.number()))

    const fields = declaredFields(schema, { orderType: 'pickup', mainCourse: 'salad' })

    expect(fields.map((f) => ({ key: f.key, isActive: f.isActive }))).toEqual([
      { key: 'email', isActive: true },
      { key: 'orderType', isActive: true },
      { key: 'leaveAtDoor', isActive: false },
      { key: 'mainCourse', isActive: true },
      { key: 'pizzaCount', isActive: false },
    ])
  })

  test('flips isActive as branches become reachable', () => {
    const schema = defineSchema()
      .field('orderType', z.enum(['pickup', 'delivery']))
      .when({ orderType: 'delivery' }, (b) => b.field('leaveAtDoor', z.boolean()))

    expect(
      declaredFields(schema, { orderType: 'pickup' }).find((f) => f.key === 'leaveAtDoor')
        ?.isActive,
    ).toBe(false)

    expect(
      declaredFields(schema, { orderType: 'delivery' }).find((f) => f.key === 'leaveAtDoor')
        ?.isActive,
    ).toBe(true)
  })

  test('preserves source order across active and inactive entries', () => {
    const schema = defineSchema()
      .field('a', z.string())
      .when({ a: 'x' }, (b) => b.field('b', z.string()))
      .field('c', z.string())

    const keys = declaredFields(schema, { a: 'y' }).map((f) => f.key)
    expect(keys).toEqual(['a', 'b', 'c'])
  })

  test('preserves source order inside nested branches', () => {
    const schema = defineSchema()
      .field('outer', z.enum(['on', 'off']))
      .when({ outer: 'on' }, (b) =>
        b
          .field('inner1', z.enum(['x', 'y']))
          .when({ inner1: 'x' }, (b) => b.field('inner2', z.string())),
      )

    expect(declaredFields(schema, { outer: 'off' }).map((f) => f.key)).toEqual([
      'outer',
      'inner1',
      'inner2',
    ])
  })

  test('dedupes a key declared in multiple branches; the active occurrence wins', () => {
    // pizzaSize has different enum options in pickup vs delivery branches.
    const schema = defineSchema()
      .field('orderType', z.enum(['pickup', 'delivery']))
      .when({ orderType: 'pickup' }, (b) =>
        b.field('pizzaSize', z.enum(['small', 'medium', 'large'])),
      )
      .when({ orderType: 'delivery' }, (b) => b.field('pizzaSize', z.enum(['small', 'medium'])))

    const pickupFields = declaredFields(schema, { orderType: 'pickup' })
    const pickupPizza = pickupFields.find((f) => f.key === 'pizzaSize')
    expect(pickupPizza?.isActive).toBe(true)
    expect((pickupPizza?.schema as { options?: readonly string[] }).options).toEqual([
      'small',
      'medium',
      'large',
    ])

    const deliveryFields = declaredFields(schema, { orderType: 'delivery' })
    const deliveryPizza = deliveryFields.find((f) => f.key === 'pizzaSize')
    expect(deliveryPizza?.isActive).toBe(true)
    expect((deliveryPizza?.schema as { options?: readonly string[] }).options).toEqual([
      'small',
      'medium',
    ])

    // Only one pizzaSize entry — duplicates are deduped.
    expect(pickupFields.filter((f) => f.key === 'pizzaSize')).toHaveLength(1)
    expect(deliveryFields.filter((f) => f.key === 'pizzaSize')).toHaveLength(1)
  })

  test('falls back to the first declaration when no occurrence is active', () => {
    const schema = defineSchema()
      .field('orderType', z.enum(['pickup', 'delivery']))
      .when({ orderType: 'pickup' }, (b) => b.field('size', z.enum(['s', 'm', 'l'])))
      .when({ orderType: 'delivery' }, (b) => b.field('size', z.enum(['s', 'm'])))

    // Neither branch fires (orderType is unset).
    const fields = declaredFields(schema, {})
    const size = fields.find((f) => f.key === 'size')
    expect(size?.isActive).toBe(false)
    expect((size?.schema as { options?: readonly string[] }).options).toEqual(['s', 'm', 'l'])
  })

  test('captures the current value alongside each declared field', () => {
    const schema = defineSchema()
      .field('email', z.string())
      .field('orderType', z.enum(['pickup', 'delivery']))

    const fields = declaredFields(schema, { email: 'a@b.co', orderType: 'pickup' })
    expect(fields.find((f) => f.key === 'email')?.value).toBe('a@b.co')
    expect(fields.find((f) => f.key === 'orderType')?.value).toBe('pickup')
  })

  test('handles whenAny by marking the child active when any pattern matches', () => {
    const schema = defineSchema()
      .field('a', z.string())
      .field('b', z.string())
      .whenAny([{ a: 'x' }, { b: 'y' }], (b) => b.field('extra', z.string()))

    expect(
      declaredFields(schema, { a: 'x', b: 'other' }).find((f) => f.key === 'extra')?.isActive,
    ).toBe(true)
    expect(
      declaredFields(schema, { a: 'other', b: 'y' }).find((f) => f.key === 'extra')?.isActive,
    ).toBe(true)
    expect(
      declaredFields(schema, { a: 'other', b: 'other' }).find((f) => f.key === 'extra')?.isActive,
    ).toBe(false)
  })

  test('handles whenPred predicates', () => {
    const schema = defineSchema()
      .field('count', z.number())
      .when(
        (v) => Number(v.count) > 5,
        (b) => b.field('extra', z.string()),
      )

    expect(declaredFields(schema, { count: 1 }).find((f) => f.key === 'extra')?.isActive).toBe(
      false,
    )
    expect(declaredFields(schema, { count: 10 }).find((f) => f.key === 'extra')?.isActive).toBe(
      true,
    )
  })

  test('returns an empty array for an empty schema', () => {
    const schema = defineSchema()
    expect(declaredFields(schema, {})).toEqual([])
  })

  test('treats inactive parents as gating inactive children', () => {
    // Inner branch can only ever be active when the outer is active.
    const schema = defineSchema()
      .field('outer', z.enum(['on', 'off']))
      .when({ outer: 'on' }, (b) =>
        b
          .field('mid', z.enum(['go', 'wait']))
          .when({ mid: 'go' }, (b) => b.field('deep', z.string())),
      )

    // outer=off → both inner fields inactive even if `mid` looks like 'go'.
    const fields = declaredFields(schema, { outer: 'off', mid: 'go' })
    expect(fields.find((f) => f.key === 'mid')?.isActive).toBe(false)
    expect(fields.find((f) => f.key === 'deep')?.isActive).toBe(false)
  })
})
