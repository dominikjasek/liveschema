import { z } from 'zod'
import { defineSchema, type InferField, type InferForm, type FormKeys } from 'form-flow'

export const mainCourses = ['pizza', 'salad'] as const
export const pizzaSizes = ['small', 'medium', 'large'] as const
export const orderTypes = ['pickup', 'delivery'] as const

export const form = defineSchema()
  .field('email', z.email())
  .field('fullName', z.string().min(2).max(100))
  .field('orderType', z.enum(orderTypes))
  .when({ orderType: 'delivery' }, (b) => b.field('leaveAtDoor', z.boolean()))
  .field('hasOrderedBefore', z.boolean())
  .when({ hasOrderedBefore: true }, (b) => b.field('favoriteItem', z.string().min(1).max(100)))
  .field('mainCourse', z.enum(mainCourses))
  .when({ mainCourse: 'pizza' }, (b) =>
    b
      .when({ orderType: 'pickup' }, (b) => b.field('pizzaSize', z.enum(pizzaSizes)))
      .when({ orderType: 'delivery' }, (b) =>
        b.field('pizzaSize', z.enum(pizzaSizes).exclude(['large'])),
      ),
  )
  .when({ mainCourse: 'pizza' }, (b) => b.field('toppings', z.string().min(2).max(200)))
  .when({ mainCourse: 'pizza' }, (b) =>
    b.field('pizzaCount', z.coerce.number().int().min(1).max(20)).when(
      (v) => Number(v.pizzaCount) >= 3,
      (b) => b.field('requestedReadyTime', z.string().min(1).max(100)),
    ),
  )
  .when({ mainCourse: 'salad' }, (b) => b.field('dressingOnSide', z.boolean()))
  .whenAny([{ orderType: 'delivery' }, { mainCourse: 'pizza' }], (b) =>
    b
      .field('needsNapkins', z.boolean().optional())
      .when({ needsNapkins: true }, (b) =>
        b.field('napkinCount', z.coerce.number().int().min(1).max(20)),
      ),
  )

export type Order = InferForm<typeof form>
export type FieldKey = FormKeys<typeof form>

export type FieldValue<K extends string> = InferField<typeof form, K>
