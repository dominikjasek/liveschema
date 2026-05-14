export const stepLabels: Record<string, string> = {
  owner: 'About you',
  animalType: 'Animal',
  dogSize: 'Dog size',
  temperament: 'Temperament',
  trainingGoal: 'Training goal',
  sport: 'Sport',
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
  review: 'Review',
}

export function humanize(field: string): string {
  return (
    stepLabels[field] ??
    field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
  )
}
