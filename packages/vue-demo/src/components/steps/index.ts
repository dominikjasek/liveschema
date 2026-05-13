import type { Component } from 'vue'
import StepAnimalType from './StepAnimalType.vue'
import StepSize from './StepSize.vue'
import StepTemperament from './StepTemperament.vue'
import StepTrainingGoal from './StepTrainingGoal.vue'
import StepSport from './StepSport.vue'
import StepHousing from './StepHousing.vue'
import StepNoiseLevel from './StepNoiseLevel.vue'
import StepYardAccess from './StepYardAccess.vue'
import StepNoDogAtHome from './StepNoDogAtHome.vue'
import StepLifestyle from './StepLifestyle.vue'
import StepScratchPost from './StepScratchPost.vue'
import StepNumberOfPosts from './StepNumberOfPosts.vue'
import StepPostType from './StepPostType.vue'
import StepAlternative from './StepAlternative.vue'
import StepTerritory from './StepTerritory.vue'
import StepTrafficTraining from './StepTrafficTraining.vue'
import StepPredatorProtection from './StepPredatorProtection.vue'
import StepSpecies from './StepSpecies.vue'
import StepSocialNeed from './StepSocialNeed.vue'
import StepDailyInteraction from './StepDailyInteraction.vue'
import StepEnrichment from './StepEnrichment.vue'
import StepCompanions from './StepCompanions.vue'
import StepHumanTime from './StepHumanTime.vue'
import StepFeedingHours from './StepFeedingHours.vue'
import StepCageSize from './StepCageSize.vue'
import StepYearsOwnedPets from './StepYearsOwnedPets.vue'
import StepPreviousAnimal from './StepPreviousAnimal.vue'
import StepOwner from './StepOwner.vue'

/**
 * Maps a Zod schema field name to its rendering component. The form walker
 * yields steps keyed by field name; this lookup picks the matching component.
 *
 * `satisfies` (rather than a `Record<string, Component>` annotation) preserves
 * the literal key union, so `StepKey` and `stepLabels` can be constrained to
 * exactly the registered step names.
 */
export const stepComponents = {
  owner: StepOwner,
  animalType: StepAnimalType,
  size: StepSize,
  temperament: StepTemperament,
  trainingGoal: StepTrainingGoal,
  sport: StepSport,
  housing: StepHousing,
  noiseLevel: StepNoiseLevel,
  yardAccess: StepYardAccess,
  noDogAtHome: StepNoDogAtHome,
  lifestyle: StepLifestyle,
  scratchPost: StepScratchPost,
  numberOfPosts: StepNumberOfPosts,
  postType: StepPostType,
  alternative: StepAlternative,
  territory: StepTerritory,
  trafficTraining: StepTrafficTraining,
  predatorProtection: StepPredatorProtection,
  species: StepSpecies,
  socialNeed: StepSocialNeed,
  dailyInteraction: StepDailyInteraction,
  enrichment: StepEnrichment,
  companions: StepCompanions,
  humanTime: StepHumanTime,
  feedingHours: StepFeedingHours,
  cageSize: StepCageSize,
  yearsOwnedPets: StepYearsOwnedPets,
  previousAnimal: StepPreviousAnimal,
} satisfies Record<string, Component>

export type StepKey = keyof typeof stepComponents
type LabelKey = StepKey | 'review'

/**
 * Human-readable stepper labels keyed by field name (plus the synthetic
 * 'review' phase). Add an entry here to override the default camelCase
 * humanization in the stepper. Keys are constrained to registered step names —
 * typos or stale entries fail to compile.
 */
export const stepLabels: Partial<Record<LabelKey, string>> = {
  animalType: 'Animal',
  size: 'Dog size',
  temperament: 'Temperament',
  trainingGoal: 'Training goal',
  sport: 'Sport',
  housing: 'Housing',
  noiseLevel: 'Noise sensitivity',
  yardAccess: 'Yard access',
  noDogAtHome: 'No dog at home',
  lifestyle: 'Indoor or outdoor',
  scratchPost: 'Scratch post',
  numberOfPosts: 'Number of posts',
  postType: 'Post material',
  alternative: 'Alternative outlet',
  territory: 'Territory',
  trafficTraining: 'Traffic training',
  predatorProtection: 'Predator protection',
  species: 'Parrot species',
  socialNeed: 'Social needs',
  dailyInteraction: 'Daily interaction',
  enrichment: 'Enrichment',
  companions: 'Companions',
  humanTime: 'Human time',
  feedingHours: 'Feeding hours',
  cageSize: 'Cage shape',
  yearsOwnedPets: 'Years with pets ❤️',
  previousAnimal: 'Previous pet',
  owner: 'Owner',
  review: 'Review',
}
