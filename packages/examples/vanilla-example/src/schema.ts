import { z } from 'zod'
import { defineForm, type InferForm, type FormKeys } from 'form-flow'

export const mainCourses = ['pizza', 'salad'] as const
export const pizzaSizes = ['small', 'medium', 'large'] as const
export const orderTypes = ['pickup', 'delivery'] as const

export const form = defineForm()
  .ask('email', z.email())
  .ask('fullName', z.string().min(2).max(100))
  .ask('orderType', z.enum(orderTypes))
  .when({ orderType: 'delivery' }, (b) => b.ask('leaveAtDoor', z.boolean()))
  .ask('hasOrderedBefore', z.boolean())
  .when({ hasOrderedBefore: true }, (b) => b.ask('favoriteItem', z.string().min(1).max(100)))
  .ask('mainCourse', z.enum(mainCourses))
  .when({ mainCourse: 'pizza' }, (b) =>
    b
      .when({ orderType: 'pickup' }, (b) => b.ask('pizzaSize', z.enum(pizzaSizes)))
      .when({ orderType: 'delivery' }, (b) =>
        b.ask('pizzaSize', z.enum(pizzaSizes).exclude(['large'])),
      ),
  )
  .when({ mainCourse: 'pizza' }, (b) => b.ask('toppings', z.string().min(2).max(200)))
  .when({ mainCourse: 'pizza' }, (b) =>
    b.ask('pizzaCount', z.coerce.number().int().min(1).max(20)).when(
      (v) => Number(v.pizzaCount) >= 3,
      (b) => b.ask('requestedReadyTime', z.string().min(1).max(100)),
    ),
  )
  .when({ mainCourse: 'salad' }, (b) => b.ask('dressingOnSide', z.boolean()))
  .whenAny([{ orderType: 'delivery' }, { mainCourse: 'pizza' }], (b) =>
    b
      .ask('needsNapkins', z.boolean().optional())
      .when({ needsNapkins: true }, (b) =>
        b.ask('napkinCount', z.coerce.number().int().min(1).max(20)),
      ),
  )

export type FormValues = InferForm<typeof form>
export type FieldKey = FormKeys<typeof form>
