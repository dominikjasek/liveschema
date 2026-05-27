import { Schema } from 'effect'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import {
  defineSchema,
  type FlatInferSchema,
  type InferSchema,
  type SchemaKeys,
} from '@liveschema/core'

// Effect Schema → Standard Schema adapter. liveschema accepts any
// StandardSchemaV1, so we wrap each Effect schema via the official helper.
const std = <A, I>(schema: Schema.Schema<A, I>): StandardSchemaV1<I, A> =>
  Schema.standardSchemaV1(schema)

// Standard Schema view of an enum literal that ALSO exposes `.options` —
// matches the convention Zod/Valibot use and lets `enumOptions()` (and our
// radio renderer) read the option list without re-declaring it at the call
// site.
function enumStd<const Lits extends readonly [string, ...string[]]>(literals: Lits) {
  const schema = Schema.Literal(...literals) as unknown as Schema.Schema<Lits[number], Lits[number]>
  const base = std(schema)
  return Object.assign(base, { options: literals })
}

export const mainCourses = ['pizza', 'salad'] as const
export const pizzaSizes = ['small', 'medium', 'large'] as const
export const pizzaDeliverySizes = ['small', 'medium'] as const
export const orderTypes = ['pickup', 'delivery'] as const

const Email = Schema.String.pipe(
  Schema.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, { message: () => 'Invalid email' }),
)
const ShortText = (min: number, max: number) =>
  Schema.String.pipe(Schema.minLength(min), Schema.maxLength(max))
const CountFromString = (min: number, max: number) =>
  Schema.NumberFromString.pipe(Schema.int(), Schema.between(min, max))

export const form = defineSchema()
  .field('email', std(Email))
  .field('fullName', std(ShortText(2, 100)))
  .field('orderType', enumStd(orderTypes))
  .when({ orderType: 'delivery' }, (b) => b.field('leaveAtDoor', std(Schema.Boolean)))
  .field('hasOrderedBefore', std(Schema.Boolean))
  .when({ hasOrderedBefore: true }, (b) => b.field('favoriteItem', std(ShortText(1, 100))))
  .field('mainCourse', enumStd(mainCourses))
  .when({ mainCourse: 'pizza' }, (b) =>
    b
      .when({ orderType: 'pickup' }, (b) => b.field('pizzaSize', enumStd(pizzaSizes)))
      .when({ orderType: 'delivery' }, (b) => b.field('pizzaSize', enumStd(pizzaDeliverySizes))),
  )
  .when({ mainCourse: 'pizza' }, (b) => b.field('toppings', std(ShortText(2, 200))))
  .when({ mainCourse: 'pizza' }, (b) =>
    b.field('pizzaCount', std(CountFromString(1, 20))).when(
      (v) => Number(v.pizzaCount) >= 3,
      (b) => b.field('requestedReadyTime', std(ShortText(1, 100))),
    ),
  )
  .when({ mainCourse: 'salad' }, (b) => b.field('dressingOnSide', std(Schema.Boolean)))
  .whenAny([{ orderType: 'delivery' }, { mainCourse: 'pizza' }], (b) =>
    b
      .field('needsNapkins', std(Schema.UndefinedOr(Schema.Boolean)))
      .when({ needsNapkins: true }, (b) => b.field('napkinCount', std(CountFromString(1, 20)))),
  )

export type FormValues = InferSchema<typeof form>
export type FormValuesFlat = FlatInferSchema<typeof form>
export type FieldKey = SchemaKeys<typeof form>
