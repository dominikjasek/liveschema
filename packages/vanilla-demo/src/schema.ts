import { z } from 'zod'
import { defineForm } from 'zod-form-flow'

export const form = defineForm()
  .ask('travelerName', z.string().min(1))
  .ask('destination', z.enum(['city', 'beach', 'mountains']))

  .when((v) => v.destination === 'city', (b) =>
    b.ask('cityVibe', z.enum(['foodie', 'museums', 'nightlife'])),
  )

  .when({ destination: 'beach' }, (b) =>
    b
      .ask('beachActivity', z.enum(['relax', 'surf', 'dive']))
      .when({ beachActivity: 'dive' }, (b) => b.ask('diveCertified', z.enum(['yes', 'no']))),
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
