import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { FieldValues, Resolver, ResolverOptions } from 'react-hook-form'
import { z } from 'zod'
import { listFormSteps, type FormBuilder } from 'zod-form-flow'

type StandardSchemaForResolver = Parameters<typeof standardSchemaResolver>[0]

/**
 * Wrap `@hookform/resolvers/standard-schema` so the schema is recomputed
 * on every validation cycle from the current form values. Useful whenever
 * the validated shape depends on what the user has already filled in.
 */
function dynamicStandardSchemaResolver<V extends object>(
  schemaFor: (data: Partial<V>) => StandardSchemaForResolver,
): Resolver<Partial<V>, unknown, V> {
  return (data, ctx, opts) =>
    standardSchemaResolver(schemaFor(data))(
      data as FieldValues,
      ctx,
      opts as ResolverOptions<FieldValues>,
    ) as ReturnType<Resolver<Partial<V>, unknown, V>>
}

/**
 * Build a react-hook-form `Resolver` from a `zod-form-flow` form definition.
 *
 * On every validation cycle it re-computes the active field set
 * (`listFormSteps(form, currentValues)`) and assembles a `z.object` of those
 * fields' schemas. The active fields — and therefore the validated shape —
 * change as the user answers branching questions.
 */
export function zodFormFlowResolver<V extends object>(
  form: FormBuilder<V>,
): Resolver<Partial<V>, unknown, V> {
  return dynamicStandardSchemaResolver<V>((data) => {
    const fields = listFormSteps(form, data as Record<string, unknown>)
    return z.object(Object.fromEntries(fields.map((f) => [f.key, f.schema])))
  })
}
