import type { Component } from 'vue'
import StepEmail from './StepEmail.vue'
import StepAnimal from './StepAnimal.vue'
import StepDogSize from './StepDogSize.vue'
import StepIndoor from './StepIndoor.vue'

/**
 * Maps a form-field key to its rendering component. `activeFields` yields
 * fields keyed by the leaf field name; this lookup picks the matching
 * component.
 */
export const stepComponents = {
  email: StepEmail,
  animal: StepAnimal,
  dogSize: StepDogSize,
  indoor: StepIndoor,
} satisfies Record<string, Component>

export type StepKey = keyof typeof stepComponents
type LabelKey = StepKey | 'review'

export const stepLabels: Partial<Record<LabelKey, string>> = {
  email: 'Your email',
  animal: 'Animal',
  dogSize: 'Dog size',
  indoor: 'Indoor cat',
  review: 'Review',
}
