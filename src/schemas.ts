import { z } from 'zod'

// ---------------------------------------------------------------------------
// Option tuples — primitive data, exported for component option rendering.
// ---------------------------------------------------------------------------

export const animalTypes = ['dog', 'cat', 'parrot'] as const
export const dogSizes = ['large', 'small'] as const
export const temperaments = ['calm', 'energetic'] as const
export const trainingGoals = ['obedience', 'therapy'] as const
export const sports = ['agility', 'flyball'] as const
export const housingOptions = ['apartment', 'house'] as const
export const noiseLevels = ['sensitive', 'resilient'] as const
export const yardAccessOptions = ['full', 'partial'] as const
export const lifestyles = ['indoor', 'outdoor'] as const
export const scratchPostOptions = ['yes', 'no'] as const
export const postTypes = ['sisal', 'cardboard'] as const
export const alternatives = ['climbingTree', 'windowPerch'] as const
export const territories = ['urban', 'rural'] as const
export const trafficOptions = ['trained', 'untrained'] as const
export const predatorOptions = ['collar', 'enclosure'] as const
export const speciesOptions = ['macaw', 'cockatiel'] as const
export const socialNeeds = ['high', 'medium'] as const
export const dailyInteractions = ['4hPlus', '2to4h'] as const
export const enrichmentOptions = ['toys', 'foraging'] as const
export const companionOptions = ['single', 'paired'] as const
export const humanTimes = ['morning', 'evening'] as const
export const feedingHourOptions = [7, 12, 17, 21] as const
export const cageSizes = ['wide', 'tall'] as const
export const previousAnimalOptions = ['dog', 'cat', 'parrot', 'none'] as const

// ---------------------------------------------------------------------------
// Per-field leaf schemas — single source of truth for both validation rules
// and component-side type inference. Step components use FieldValue<K> so
// `useField<...>` no longer duplicates the leaf's TS type.
// ---------------------------------------------------------------------------

export const fieldSchemas = {
  animalType: z.enum(animalTypes),
  size: z.enum(dogSizes),
  temperament: z.enum(temperaments),
  trainingGoal: z.enum(trainingGoals),
  sport: z.enum(sports),
  housing: z.enum(housingOptions),
  noiseLevel: z.enum(noiseLevels),
  yardAccess: z.enum(yardAccessOptions),
  noDogAtHome: z.literal(true, { message: 'You must confirm to continue' }),
  lifestyle: z.enum(lifestyles),
  scratchPost: z.enum(scratchPostOptions),
  numberOfPosts: z.coerce.number().int().min(1).max(5),
  postType: z.enum(postTypes),
  alternative: z.enum(alternatives),
  territory: z.enum(territories),
  trafficTraining: z.enum(trafficOptions),
  predatorProtection: z.enum(predatorOptions),
  species: z.enum(speciesOptions),
  socialNeed: z.enum(socialNeeds),
  dailyInteraction: z.enum(dailyInteractions),
  enrichment: z.enum(enrichmentOptions),
  companions: z.enum(companionOptions),
  humanTime: z.enum(humanTimes),
  feedingHours: z.array(z.number()).min(1),
  cageSize: z.enum(cageSizes),
  yearsOwnedPets: z.coerce.number().int().min(0).max(80),
  previousAnimal: z.enum(previousAnimalOptions),
  ownerName: z.string().min(1, 'Required'),
  ownerEmail: z.email('Invalid email'),
} as const

export type FieldName = keyof typeof fieldSchemas
export type FieldValue<K extends FieldName> = z.infer<(typeof fieldSchemas)[K]>

// ---------------------------------------------------------------------------
// Tree-shaped schema. Discriminator fields stay as z.literal(...) inside each
// option (required by z.discriminatedUnion); non-discriminator leaves and the
// flat experience/owner sub-schemas reuse fieldSchemas.
// ---------------------------------------------------------------------------

const dogLargeBranch = z.discriminatedUnion('temperament', [
  z.object({ temperament: z.literal('calm'), trainingGoal: fieldSchemas.trainingGoal }),
  z.object({ temperament: z.literal('energetic'), sport: fieldSchemas.sport }),
])

const dogSmallBranch = z.discriminatedUnion('housing', [
  z.object({ housing: z.literal('apartment'), noiseLevel: fieldSchemas.noiseLevel }),
  z.object({ housing: z.literal('house'), yardAccess: fieldSchemas.yardAccess }),
])

const dogBranch = z.discriminatedUnion('size', [
  z.object({ size: z.literal('large'), branch: dogLargeBranch }),
  z.object({ size: z.literal('small'), branch: dogSmallBranch }),
])

const catIndoorYesBranch = z.object({
  numberOfPosts: fieldSchemas.numberOfPosts,
  postType: fieldSchemas.postType,
})

const catIndoorBranch = z.discriminatedUnion('scratchPost', [
  z.object({ scratchPost: z.literal('yes'), branch: catIndoorYesBranch }),
  z.object({ scratchPost: z.literal('no'), alternative: fieldSchemas.alternative }),
])

const catOutdoorBranch = z.discriminatedUnion('territory', [
  z.object({ territory: z.literal('urban'), trafficTraining: fieldSchemas.trafficTraining }),
  z.object({ territory: z.literal('rural'), predatorProtection: fieldSchemas.predatorProtection }),
])

const catLifestyleBranch = z.discriminatedUnion('lifestyle', [
  z.object({ lifestyle: z.literal('indoor'), branch: catIndoorBranch }),
  z.object({ lifestyle: z.literal('outdoor'), branch: catOutdoorBranch }),
])

const parrotMacawBranch = z.discriminatedUnion('socialNeed', [
  z.object({ socialNeed: z.literal('high'), dailyInteraction: fieldSchemas.dailyInteraction }),
  z.object({ socialNeed: z.literal('medium'), enrichment: fieldSchemas.enrichment }),
])

const parrotCockatielPairedBranch = z.object({
  feedingHours: fieldSchemas.feedingHours,
  cageSize: fieldSchemas.cageSize,
})

const parrotCockatielBranch = z.discriminatedUnion('companions', [
  z.object({ companions: z.literal('single'), humanTime: fieldSchemas.humanTime }),
  z.object({ companions: z.literal('paired'), branch: parrotCockatielPairedBranch }),
])

const parrotBranch = z.discriminatedUnion('species', [
  z.object({ species: z.literal('macaw'), branch: parrotMacawBranch }),
  z.object({ species: z.literal('cockatiel'), branch: parrotCockatielBranch }),
])

const animalSchema = z.discriminatedUnion('animalType', [
  z.object({ animalType: z.literal('dog'), branch: dogBranch }),
  z.object({
    animalType: z.literal('cat'),
    noDogAtHome: fieldSchemas.noDogAtHome,
    branch: catLifestyleBranch,
  }),
  z.object({ animalType: z.literal('parrot'), branch: parrotBranch }),
])

export const experienceSchema = z.object({
  yearsOwnedPets: fieldSchemas.yearsOwnedPets,
  previousAnimal: fieldSchemas.previousAnimal,
})

export const ownerSchema = z.object({
  ownerName: fieldSchemas.ownerName,
  ownerEmail: fieldSchemas.ownerEmail,
})

export const adoptionSchema = z.intersection(
  z.intersection(animalSchema, experienceSchema),
  ownerSchema,
)
export type Adoption = z.infer<typeof adoptionSchema>
