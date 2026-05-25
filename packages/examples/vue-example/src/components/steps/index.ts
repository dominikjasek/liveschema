import type { Component } from 'vue'
import type { LiveSchemaField } from '@liveschema/vue'
import TextStep from './TextStep.vue'
import RadioStep from './RadioStep.vue'
import CheckboxStep from './CheckboxStep.vue'
import NumberStep from './NumberStep.vue'
import type { FieldKey } from '@/schemas'

/**
 * Resolves a form field to the Vue component + props that should render it.
 * Reads the field's enumOptions for radios (e.g. delivery `pizzaSize` excludes
 * `large`) — useLiveSchema bakes the right schema into each entry.
 */
export type StepBinding = {
  component: Component
  props: Record<string, unknown>
}

type Renderer = (key: FieldKey, field: LiveSchemaField) => StepBinding

const text =
  (question: string, type: 'text' | 'email' = 'text'): Renderer =>
  (key) => ({
    component: TextStep,
    props: { path: key, question, type },
  })

const checkbox =
  (question: string, confirmLabel?: string): Renderer =>
  (key) => ({
    component: CheckboxStep,
    props: { path: key, question, confirmLabel },
  })

const number =
  (question: string, min?: number, max?: number): Renderer =>
  (key) => ({
    component: NumberStep,
    props: { path: key, question, min, max },
  })

const radio =
  (question: string): Renderer =>
  (key, field) => ({
    component: RadioStep,
    props: { path: key, question, options: field.enumOptions ?? [] },
  })

const renderers: Record<FieldKey, Renderer> = {
  email: text('Your email', 'email'),
  fullName: text('Your full name'),
  orderType: radio('How would you like to receive your order?'),
  leaveAtDoor: checkbox('Leave at the door if no answer?', 'Yes, leave at the door'),
  hasOrderedBefore: checkbox('Have you ordered from us before?', 'Yes, returning customer'),
  favoriteItem: text('Your favorite item from last time'),
  mainCourse: radio('What would you like for your main course?'),
  pizzaSize: radio('Pizza size'),
  toppings: text('Toppings (comma-separated)'),
  pizzaCount: number('How many pizzas?', 1, 20),
  requestedReadyTime: text('When should it be ready? (3+ pizzas need 30+ min prep)'),
  dressingOnSide: checkbox('Dressing on the side?', 'Yes, on the side'),
  needsNapkins: checkbox('Include extra napkins?', 'Yes, please'),
  napkinCount: number('How many extra napkins?', 1, 20),
}

export function resolveStep(key: FieldKey, field: LiveSchemaField): StepBinding | undefined {
  const renderer = renderers[key]
  return renderer ? renderer(key, field) : undefined
}

export const stepLabels: Record<string, string> = {
  email: 'Your email',
  fullName: 'Full name',
  orderType: 'Order type',
  leaveAtDoor: 'Leave at door',
  hasOrderedBefore: 'Returning customer',
  favoriteItem: 'Favorite item',
  mainCourse: 'Main course',
  pizzaSize: 'Pizza size',
  toppings: 'Toppings',
  pizzaCount: 'Pizza count',
  requestedReadyTime: 'Ready time',
  dressingOnSide: 'Dressing on side',
  needsNapkins: 'Napkins',
  napkinCount: 'Napkin count',
  review: 'Review',
}
