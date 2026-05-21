import type { Component } from 'vue'
import { enumOptions, type SchemaField } from 'liveschema'
import TextStep from './TextStep.vue'
import RadioStep from './RadioStep.vue'
import CheckboxStep from './CheckboxStep.vue'
import NumberStep from './NumberStep.vue'
import type { FieldKey } from '@/schemas'

/**
 * Resolves a form field to the Vue component + props that should render it.
 * Reads the schema for radio options so `pizzaSize` picks up the
 * delivery-specific enum (excluding `large`).
 */
export type StepBinding = {
  component: Component
  props: Record<string, unknown>
}

type Renderer = (step: SchemaField) => StepBinding

const text =
  (question: string, type: 'text' | 'email' = 'text'): Renderer =>
  (step) => ({
    component: TextStep,
    props: { path: step.key, question, type },
  })

const checkbox =
  (question: string, confirmLabel?: string): Renderer =>
  (step) => ({
    component: CheckboxStep,
    props: { path: step.key, question, confirmLabel },
  })

const number =
  (question: string, min?: number, max?: number): Renderer =>
  (step) => ({
    component: NumberStep,
    props: { path: step.key, question, min, max },
  })

const radio =
  (question: string): Renderer =>
  (step) => ({
    component: RadioStep,
    props: { path: step.key, question, options: enumOptions(step.schema) ?? [] },
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

export function resolveStep(step: SchemaField): StepBinding | undefined {
  const renderer = renderers[step.key as FieldKey]
  return renderer ? renderer(step) : undefined
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
