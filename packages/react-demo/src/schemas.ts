import { z } from 'zod'
import { defineForm, type InferField, type InferForm } from 'zod-form-flow'

// ── Option tuples — exported for component radio/select rendering ───────────

export const animalTypes = ['dog', 'cat', 'parrot'] as const
export const dogSizes = ['large', 'small'] as const
export const temperaments = ['calm', 'energetic'] as const
export const trainingGoals = ['obedience', 'therapy'] as const
export const sports = ['agility', 'flyball'] as const
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

// ── Form definition ────────────────────────────────────────────────────────
// Flat shape: every leaf becomes a top-level key. Branching via .when().

export const form = defineForm()
  .ask(
    'owner',
    z.object({
      name: z.string().min(1, 'Required'),
      email: z.email('Invalid email'),
    }),
  )

  .ask('animalType', z.enum(animalTypes))

  .when({ animalType: 'dog' }, (b) =>
    b
      .ask('dogSize', z.enum(dogSizes))
      .when({ dogSize: 'large' }, (b) =>
        b
          .ask('temperament', z.enum(temperaments))
          .when({ temperament: 'calm' }, (b) =>
            b.ask('trainingGoal', z.enum(trainingGoals)),
          )
          .when({ temperament: 'energetic' }, (b) => b.ask('sport', z.enum(sports))),
      ),
  )

  .when({ animalType: 'cat' }, (b) =>
    b
      .ask('noDogAtHome', z.literal(true, { message: 'You must confirm to continue' }))
      .ask('lifestyle', z.enum(lifestyles))
      .when({ lifestyle: 'indoor' }, (b) =>
        b
          .ask('scratchPost', z.enum(scratchPostOptions))
          .when({ scratchPost: 'yes' }, (b) =>
            b
              .ask('numberOfPosts', z.coerce.number().int().min(1).max(5))
              .ask('postType', z.enum(postTypes)),
          )
          .when({ scratchPost: 'no' }, (b) =>
            b.ask('alternative', z.enum(alternatives)),
          ),
      )
      .when({ lifestyle: 'outdoor' }, (b) =>
        b
          .ask('territory', z.enum(territories))
          .when({ territory: 'urban' }, (b) =>
            b.ask('trafficTraining', z.enum(trafficOptions)),
          )
          .when({ territory: 'rural' }, (b) =>
            b.ask('predatorProtection', z.enum(predatorOptions)),
          ),
      ),
  )

  .when({ animalType: 'parrot' }, (b) =>
    b
      .ask('species', z.enum(speciesOptions))
      .when({ species: 'macaw' }, (b) =>
        b
          .ask('socialNeed', z.enum(socialNeeds))
          .when({ socialNeed: 'high' }, (b) =>
            b.ask('dailyInteraction', z.enum(dailyInteractions)),
          )
          .when({ socialNeed: 'medium' }, (b) =>
            b.ask('enrichment', z.enum(enrichmentOptions)),
          ),
      )
      .when({ species: 'cockatiel' }, (b) =>
        b
          .ask('companions', z.enum(companionOptions))
          .when({ companions: 'single' }, (b) =>
            b.ask('humanTime', z.enum(humanTimes)),
          )
          .when({ companions: 'paired' }, (b) =>
            b
              .ask('feedingHours', z.array(z.number()).min(1))
              .ask('cageSize', z.enum(cageSizes)),
          ),
      ),
  )

  .ask(
    'experience',
    z.object({
      yearsOwnedPets: z.coerce.number().int().min(0).max(80),
      previousAnimal: z.enum(previousAnimalOptions),
    }),
  )

export type Adoption = InferForm<typeof form>

export type FieldValue<K extends string> = InferField<typeof form, K>
