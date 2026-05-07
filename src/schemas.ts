import { z } from 'zod'

// ---------------------------------------------------------------------------
// Option tuples — data primitives. Imported by step components for rendering.
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

// ---------------------------------------------------------------------------
// Tree-shaped Zod schema. Each branching point = a discriminatedUnion.
// Sequential sub-trees nest under a `branch` sub-key; flat sequential fields
// (e.g. owner name + email) live as siblings in the same z.object.
// ---------------------------------------------------------------------------

const dogLargeBranch = z.discriminatedUnion('temperament', [
  z.object({ temperament: z.literal('calm'), trainingGoal: z.enum(trainingGoals) }),
  z.object({ temperament: z.literal('energetic'), sport: z.enum(sports) }),
])

const dogSmallBranch = z.discriminatedUnion('housing', [
  z.object({ housing: z.literal('apartment'), noiseLevel: z.enum(noiseLevels) }),
  z.object({ housing: z.literal('house'), yardAccess: z.enum(yardAccessOptions) }),
])

const dogBranch = z.discriminatedUnion('size', [
  z.object({ size: z.literal('large'), branch: dogLargeBranch }),
  z.object({ size: z.literal('small'), branch: dogSmallBranch }),
])

const catIndoorYesBranch = z.object({
  numberOfPosts: z.coerce.number().int().min(1).max(5),
  postType: z.enum(postTypes),
})

const catIndoorBranch = z.discriminatedUnion('scratchPost', [
  z.object({ scratchPost: z.literal('yes'), branch: catIndoorYesBranch }),
  z.object({ scratchPost: z.literal('no'), alternative: z.enum(alternatives) }),
])

const catOutdoorBranch = z.discriminatedUnion('territory', [
  z.object({ territory: z.literal('urban'), trafficTraining: z.enum(trafficOptions) }),
  z.object({ territory: z.literal('rural'), predatorProtection: z.enum(predatorOptions) }),
])

const catLifestyleBranch = z.discriminatedUnion('lifestyle', [
  z.object({ lifestyle: z.literal('indoor'), branch: catIndoorBranch }),
  z.object({ lifestyle: z.literal('outdoor'), branch: catOutdoorBranch }),
])

const parrotMacawBranch = z.discriminatedUnion('socialNeed', [
  z.object({ socialNeed: z.literal('high'), dailyInteraction: z.enum(dailyInteractions) }),
  z.object({ socialNeed: z.literal('medium'), enrichment: z.enum(enrichmentOptions) }),
])

const parrotCockatielPairedBranch = z.object({
  feedingHours: z.array(z.number()).min(1),
  cageSize: z.enum(cageSizes),
})

const parrotCockatielBranch = z.discriminatedUnion('companions', [
  z.object({ companions: z.literal('single'), humanTime: z.enum(humanTimes) }),
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
    noDogAtHome: z.literal(true),
    branch: catLifestyleBranch,
  }),
  z.object({ animalType: z.literal('parrot'), branch: parrotBranch }),
])

export const previousAnimalOptions = ['dog', 'cat', 'parrot', 'none'] as const

export const experienceSchema = z.object({
  yearsOwnedPets: z.coerce.number().int().min(0).max(80),
  previousAnimal: z.enum(previousAnimalOptions),
})

export const ownerSchema = z.object({
  ownerName: z.string().min(1, 'Required'),
  ownerEmail: z.email('Invalid email'),
})

export const adoptionSchema = z.intersection(
  z.intersection(animalSchema, experienceSchema),
  ownerSchema,
)
export type Adoption = z.infer<typeof adoptionSchema>
