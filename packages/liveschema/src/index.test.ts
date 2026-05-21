import { describe, expect, expectTypeOf, test } from 'vitest'
import { z } from 'zod'
import {
  defineSchema,
  activeFields,
  validateSchema,
  toStandardSchema,
  type InferSchema,
  type InferField,
  type SchemaKeys,
} from './index'

const order = defineSchema()
  .field('email', z.email())
  .field('orderType', z.enum(['pickup', 'delivery']))
  .when({ orderType: 'delivery' }, (b) => b.field('leaveAtDoor', z.boolean()))
  .field('mainCourse', z.enum(['pizza', 'salad']))
  .when({ mainCourse: 'pizza' }, (b) =>
    b.field('pizzaCount', z.coerce.number().int().min(1).max(20)),
  )

describe('activeFields', () => {
  test('returns the unconditional fields when no branches match', () => {
    const keys = activeFields(order, { orderType: 'pickup', mainCourse: 'salad' }).map((f) => f.key)
    expect(keys).toEqual(['email', 'orderType', 'mainCourse'])
  })

  test('reveals an equality branch when its discriminator matches', () => {
    const keys = activeFields(order, { orderType: 'delivery', mainCourse: 'pizza' }).map(
      (f) => f.key,
    )
    expect(keys).toEqual(['email', 'orderType', 'leaveAtDoor', 'mainCourse', 'pizzaCount'])
  })
})

describe('validateSchema', () => {
  test('reports the first issue per reachable field', () => {
    const errors = validateSchema(order, {
      email: 'not-an-email',
      orderType: 'pickup',
      mainCourse: 'salad',
    })
    expect(errors).toMatchObject({ email: expect.any(String) })
    expect((errors as Record<string, string>).orderType).toBeUndefined()
  })

  test('returns an empty object when all reachable fields are valid', () => {
    const errors = validateSchema(order, {
      email: 'a@b.co',
      orderType: 'pickup',
      mainCourse: 'salad',
    })
    expect(errors).toEqual({})
  })

  test('ignores values for fields that are not currently reachable', () => {
    const errors = validateSchema(order, {
      email: 'a@b.co',
      orderType: 'pickup',
      mainCourse: 'salad',
      pizzaCount: 999,
    })
    expect(errors).toEqual({})
  })
})

describe('toStandardSchema', () => {
  test('produces a Standard Schema validator that strips abandoned-branch values', async () => {
    const standard = toStandardSchema(order)
    const result = await standard['~standard'].validate({
      email: 'a@b.co',
      orderType: 'pickup',
      mainCourse: 'pizza',
      pizzaCount: 2,
      leaveAtDoor: true,
    })

    expect('issues' in result && result.issues).toBeFalsy()
    if ('value' in result && result.value) {
      expect(result.value).toEqual({
        email: 'a@b.co',
        orderType: 'pickup',
        mainCourse: 'pizza',
        pizzaCount: 2,
      })
    }
  })

  test('reports issues for invalid input', async () => {
    const standard = toStandardSchema(order)
    const result = await standard['~standard'].validate({ orderType: 'pickup' })
    expect('issues' in result && result.issues && result.issues.length).toBeTruthy()
  })
})

describe('types', () => {
  type Order = InferSchema<typeof order>

  test('SchemaKeys is the union of every field across variants', () => {
    expectTypeOf<SchemaKeys<typeof order>>().toEqualTypeOf<
      'email' | 'orderType' | 'leaveAtDoor' | 'mainCourse' | 'pizzaCount'
    >()
  })

  test('InferField pulls a single field across all variants', () => {
    expectTypeOf<InferField<typeof order, 'email'>>().toEqualTypeOf<string>()
    expectTypeOf<InferField<typeof order, 'orderType'>>().toEqualTypeOf<'pickup' | 'delivery'>()
    expectTypeOf<InferField<typeof order, 'mainCourse'>>().toEqualTypeOf<'pizza' | 'salad'>()
    expectTypeOf<InferField<typeof order, 'leaveAtDoor'>>().toEqualTypeOf<boolean>()
    expectTypeOf<InferField<typeof order, 'pizzaCount'>>().toEqualTypeOf<number>()
  })

  test('InferSchema produces a discriminated union narrowable on equality keys', () => {
    type Pickup = Extract<Order, { orderType: 'pickup' }>
    type Delivery = Extract<Order, { orderType: 'delivery' }>

    expectTypeOf<Pickup>().toHaveProperty('email').toEqualTypeOf<string>()
    expectTypeOf<Pickup>().not.toHaveProperty('leaveAtDoor')

    expectTypeOf<Delivery>().toHaveProperty('leaveAtDoor').toEqualTypeOf<boolean>()
  })

  test('inner equality branches narrow downstream variants as required', () => {
    type Pizza = Extract<Order, { mainCourse: 'pizza' }>
    type Salad = Extract<Order, { mainCourse: 'salad' }>

    expectTypeOf<Pizza>().toHaveProperty('pizzaCount').toEqualTypeOf<number>()
    expectTypeOf<Salad>().not.toHaveProperty('pizzaCount')
  })

  test('cross-branch narrowing combines independent discriminators', () => {
    type DeliveryPizza = Extract<Order, { orderType: 'delivery'; mainCourse: 'pizza' }>

    expectTypeOf<DeliveryPizza>().toEqualTypeOf<{
      email: string
      orderType: 'delivery'
      leaveAtDoor: boolean
      mainCourse: 'pizza'
      pizzaCount: number
    }>()
  })
})
