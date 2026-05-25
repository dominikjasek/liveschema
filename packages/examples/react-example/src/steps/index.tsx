import type { ReactNode } from 'react'
import type { LiveSchemaField } from '@liveschema/react'
import type { AdoptionForm } from '../formTypes'
import type { FieldKey } from '../schemas'
import { RadioStep } from './RadioStep'
import { TextStep } from './TextStep'
import { CheckboxStep } from './CheckboxStep'
import { StepNumberInput } from './StepNumberInput'

type Renderer = (form: AdoptionForm, field: LiveSchemaField<FieldKey>) => ReactNode

const text = (path: FieldKey, question: string, type: 'text' | 'email' = 'text'): Renderer =>
  function TextRenderer(form) {
    return <TextStep form={form} path={path} question={question} type={type} />
  }

const checkbox = (path: FieldKey, question: string, confirmLabel?: string): Renderer =>
  function CheckboxRenderer(form) {
    return <CheckboxStep form={form} path={path} question={question} confirmLabel={confirmLabel} />
  }

const number = (path: FieldKey, question: string, min?: number, max?: number): Renderer =>
  function NumberRenderer(form) {
    return <StepNumberInput form={form} path={path} question={question} min={min} max={max} />
  }

const radio = (path: FieldKey, question: string): Renderer =>
  function RadioRenderer(form, field) {
    return (
      <RadioStep form={form} path={path} question={question} options={field.enumOptions ?? []} />
    )
  }

export const stepRenderers: Record<FieldKey, Renderer> = {
  email: text('email', 'Your email', 'email'),
  fullName: text('fullName', 'Your full name'),
  orderType: radio('orderType', 'How would you like to receive your order?'),
  leaveAtDoor: checkbox('leaveAtDoor', 'Leave at the door if no answer?', 'Yes, leave at the door'),
  hasOrderedBefore: checkbox(
    'hasOrderedBefore',
    'Have you ordered from us before?',
    'Yes, returning customer',
  ),
  favoriteItem: text('favoriteItem', 'Your favorite item from last time'),
  mainCourse: radio('mainCourse', 'What would you like for your main course?'),
  pizzaSize: radio('pizzaSize', 'Pizza size'),
  toppings: text('toppings', 'Toppings (comma-separated)'),
  pizzaCount: number('pizzaCount', 'How many pizzas?', 1, 20),
  requestedReadyTime: text(
    'requestedReadyTime',
    'When should it be ready? (3+ pizzas need 30+ min prep)',
  ),
  dressingOnSide: checkbox('dressingOnSide', 'Dressing on the side?', 'Yes, on the side'),
  needsNapkins: checkbox('needsNapkins', 'Include extra napkins?', 'Yes, please'),
  napkinCount: number('napkinCount', 'How many extra napkins?', 1, 20),
}
