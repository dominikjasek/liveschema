// TanStack Form's instance is deeply generic; for the dynamic walker-driven
// flow each step component only needs `form.Field` access, so we keep the
// prop loosely typed and rely on the per-field `FieldValue<K>` for shape.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdoptionForm = any
