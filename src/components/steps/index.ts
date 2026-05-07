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
import StepOwnerName from './StepOwnerName.vue'
import StepOwnerEmail from './StepOwnerEmail.vue'

/**
 * Maps a Zod schema field name to its rendering component. The form walker
 * yields steps keyed by field name; this lookup picks the matching component.
 */
export const stepComponents: Record<string, Component> = {
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
  ownerName: StepOwnerName,
  ownerEmail: StepOwnerEmail,
}
