import { z } from 'zod'
import { defineSchema, type InferSchema, type SchemaKeys } from 'liveschema'

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
  // Large pizzas don't fit in our delivery boxes — restrict the pizzaSize
  // enum to small/medium for delivery. The two `.when` patterns are mutually
  // exclusive (orderType is either 'pickup' or 'delivery'), so pizzaSize is
  // declared exactly once at runtime.
  .when({ mainCourse: 'pizza' }, (b) =>
    b
      .when({ orderType: 'pickup' }, (b) => b.field('pizzaSize', z.enum(pizzaSizes)))
      .when({ orderType: 'delivery' }, (b) =>
        b.field('pizzaSize', z.enum(pizzaSizes).exclude(['large'])),
      ),
  )
  .when({ mainCourse: 'pizza' }, (b) => b.field('toppings', z.string().min(2).max(200)))
  // Catering-size orders (3+ pizzas) take 30+ minutes to prep, so we ask
  // when the customer wants it ready. The predicate form `.when((v) => ...)`
  // is required because `pizzaCount` is a number — literal-pattern `.when`
  // can only test equality. The follow-up field is OPTIONAL on the result
  // type since TS can't verify a runtime threshold at compile time. The
  // predicate is placed *inside* the pizza branch so its `v` already has
  // `pizzaCount` on V.
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

export type FormValues = InferSchema<typeof form>
export type FieldKey = SchemaKeys<typeof form>
