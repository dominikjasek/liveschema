import { z } from 'zod'
import { defineForm, type InferForm } from 'zod-form-flow'

export const form = defineForm()
  .ask('travelerName', z.string().min(1))
  .ask('destination', z.enum(['city', 'beach', 'mountains']))

  .when((v) => v.destination === 'city', (b) =>
    b.ask('cityVibe', z.enum(['foodie', 'museums', 'nightlife'])),
  )

  .when({ destination: 'beach' }, (b) =>
    b
      .ask('beachActivity', z.enum(['relax', 'surf', 'dive']))
      .when({ beachActivity: 'dive' }, (b) => b.ask('diveCertified', z.boolean())),
  )

  .when({ destination: 'mountains' }, (b) =>
    b
      .ask('season', z.enum(['summer', 'winter']))
      .when({ season: 'winter' }, (b) =>
        b
          .ask('skiLevel', z.enum(['beginner', 'intermediate', 'expert']))
          .when({ skiLevel: 'beginner' }, (b) =>
            b.ask('needsSkiLessons', z.enum(['yes', 'no'])),
          ),
      )
      .when({ season: 'summer' }, (b) =>
        b.ask('hikeIntensity', z.enum(['easy', 'moderate', 'hard'])),
      ),
  )

  .ask('travelers', z.coerce.number().int().min(1).max(20))
  .when((v) => Number(v.travelers) >= 5, (b) => b.ask('groupContactPhone', z.string().min(6)))

  .ask('budget', z.enum(['low', 'medium', 'high']))
  .when(
    (v) => Number(v.travelers) >= 5 && v.budget === 'low',
    (b) => b.ask('hostelOk', z.enum(['yes', 'no'])),
  )

// Discriminated union over every reachable branch. Hover to see all variants.
// Example variants (illustrative):
//   | { destination: 'city', cityVibe: 'foodie'|'museums'|'nightlife', ... }
//   | { destination: 'beach', beachActivity: 'relax'|'surf', ... }
//   | { destination: 'beach', beachActivity: 'dive', diveCertified: 'yes'|'no', ... }
//   | { destination: 'mountains', season: 'summer', hikeIntensity: ..., ... }
//   | { destination: 'mountains', season: 'winter',
//       skiLevel: 'intermediate'|'expert', ... }
//   | { destination: 'mountains', season: 'winter',
//       skiLevel: 'beginner', needsSkiLessons: 'yes'|'no', ... }
export type FormValues = InferForm<typeof form>

// Sanity check: TS should narrow `needsSkiLessons` to required when
// skiLevel === 'beginner'.
function _probe(v: FormValues) {
  if (
    v.destination === 'beach'
  ) {
    if (v.beachActivity === "dive") {
      console.log(v.diveCertified)
    }
  }
}
