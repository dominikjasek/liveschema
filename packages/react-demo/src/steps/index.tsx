import type { ReactNode } from 'react'
import type { AdoptionForm } from '../formTypes'
import {
  alternatives,
  animalTypes,
  cageSizes,
  companionOptions,
  dailyInteractions,
  dogSizes,
  enrichmentOptions,
  humanTimes,
  lifestyles,
  postTypes,
  predatorOptions,
  previousAnimalOptions,
  scratchPostOptions,
  socialNeeds,
  speciesOptions,
  sports,
  temperaments,
  territories,
  trafficOptions,
  trainingGoals,
  type Adoption,
} from '../schemas'

// Adoption is a discriminated union — `keyof Adoption` only sees keys common
// to every variant. Distribute over the union to collect *every* reachable
// field key (e.g. dogSize, scratchPost, feedingHours).
type FormKey = Adoption extends infer V ? (V extends object ? keyof V : never) : never
import { RadioStep } from './RadioStep'
import { StepFeedingHours } from './StepFeedingHours'
import { StepNoDogAtHome } from './StepNoDogAtHome'
import { StepNumberInput } from './StepNumberInput'
import { StepOwner } from './StepOwner'

type Renderer = (form: AdoptionForm) => ReactNode

const radio = <T extends string | number>(
  path: FormKey,
  question: string,
  options: readonly T[],
): Renderer => {
  return (form) => (
    <RadioStep form={form} path={path} question={question} options={options} />
  )
}

export const stepRenderers: Record<FormKey, Renderer> = {
  owner: (form) => <StepOwner form={form} />,
  animalType: radio('animalType', 'What kind of animal would you like to adopt?', animalTypes),
  dogSize: radio('dogSize', 'How big is the dog?', dogSizes),
  temperament: radio('temperament', "What's the dog's temperament?", temperaments),
  trainingGoal: radio('trainingGoal', 'What training goal fits best?', trainingGoals),
  sport: radio('sport', 'Which sport would you pursue?', sports),
  noDogAtHome: (form) => <StepNoDogAtHome form={form} />,
  lifestyle: radio('lifestyle', 'Indoor or outdoor cat?', lifestyles),
  scratchPost: radio('scratchPost', 'Will you provide a scratching post?', scratchPostOptions),
  numberOfPosts: (form) => (
    <StepNumberInput
      form={form}
      path="numberOfPosts"
      question="How many scratching posts will you install?"
      min={1}
      max={5}
    />
  ),
  postType: radio('postType', 'What material for the post?', postTypes),
  alternative: radio('alternative', 'Pick an alternative outlet', alternatives),
  territory: radio('territory', "What's the surrounding territory?", territories),
  trafficTraining: radio('trafficTraining', 'Is the cat traffic-trained?', trafficOptions),
  predatorProtection: radio(
    'predatorProtection',
    'How will you handle predators?',
    predatorOptions,
  ),
  species: radio('species', 'Which parrot species?', speciesOptions),
  socialNeed: radio('socialNeed', "What's the bird's social need?", socialNeeds),
  dailyInteraction: radio(
    'dailyInteraction',
    'How much daily interaction can you provide?',
    dailyInteractions,
  ),
  enrichment: radio('enrichment', 'Pick an enrichment type', enrichmentOptions),
  companions: radio('companions', 'Single bird or paired?', companionOptions),
  humanTime: radio('humanTime', 'When do you have time for the bird?', humanTimes),
  feedingHours: (form) => <StepFeedingHours form={form} />,
  cageSize: radio('cageSize', 'Cage shape preference?', cageSizes),
  yearsOwnedPets: (form) => (
    <StepNumberInput
      form={form}
      path="yearsOwnedPets"
      question="How many years have you owned pets?"
      min={0}
      max={80}
    />
  ),
  previousAnimal: radio('previousAnimal', 'What was your previous pet?', previousAnimalOptions),
}
