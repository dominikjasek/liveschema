export const stepLabels: Record<string, string> = {
  email: 'Your email',
  fullName: 'Full name',
  orderType: 'Order type',
  leaveAtDoor: 'Leave at door',
  hasOrderedBefore: 'Returning customer',
  favoriteItem: 'Favorite item',
  mainCourse: 'Main course',
  pizzaSize: 'Pizza size',
  toppings: 'Toppings',
  pizzaCount: 'Pizza count',
  requestedReadyTime: 'Ready time',
  dressingOnSide: 'Dressing on side',
  needsNapkins: 'Napkins',
  napkinCount: 'Napkin count',
  review: 'Review',
}

export function humanize(field: string): string {
  return stepLabels[field] ?? field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
}
