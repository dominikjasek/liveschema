import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { FieldValues, Resolver, ResolverOptions } from 'react-hook-form'
import { listFormSteps, type FormBuilder } from 'form-flow'

type StandardSchemaForResolver = Parameters<typeof standardSchemaResolver>[0]

/**
 * Assemble the currently-reachable fields into a single Standard Schema
 * object validator. Mirrors `z.object(...)` / `v.object(...)` but built from
 * the spec directly so the resolver depends on no specific validation lib.
 */
function objectFromFields(
  fields: ReadonlyArray<{ key: string; schema: StandardSchemaV1 }>,
): StandardSchemaV1<Record<string, unknown>, Record<string, unknown>> {
  return {
    '~standard': {
      version: 1,
      vendor: 'form-flow',
      validate(input) {
        if (input === null || typeof input !== 'object') {
          return { issues: [{ message: 'Expected object', path: [] }] }
        }
        const data = input as Record<string, unknown>
        const issues: StandardSchemaV1.Issue[] = []
        const out: Record<string, unknown> = {}
        const pending: Array<Promise<void>> = []

        for (const field of fields) {
          const result = field.schema['~standard'].validate(data[field.key])
          if (result instanceof Promise) {
            pending.push(result.then((r) => collect(r, field.key, issues, out)))
          } else {
            collect(result, field.key, issues, out)
          }
        }

        if (pending.length > 0) {
          return Promise.all(pending).then(() =>
            issues.length ? { issues } : { value: out },
          )
        }
        return issues.length ? { issues } : { value: out }
      },
    },
  }
}

function collect(
  result: StandardSchemaV1.Result<unknown>,
  key: string,
  issues: StandardSchemaV1.Issue[],
  out: Record<string, unknown>,
): void {
  if (result.issues) {
    for (const issue of result.issues) {
      issues.push({
        message: issue.message,
        path: [key, ...(issue.path ?? [])],
      })
    }
  } else {
    out[key] = result.value
  }
}

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
 * Build a react-hook-form `Resolver` from a `form-flow` form definition.
 *
 * On every validation cycle it re-computes the active field set
 * (`listFormSteps(form, currentValues)`) and assembles a Standard Schema
 * object of those fields' schemas. The active fields — and therefore the
 * validated shape — change as the user answers branching questions.
 */
export function formFlowResolver<V extends object, TIn extends FieldValues = Partial<V> & FieldValues>(
  form: FormBuilder<V>,
): Resolver<TIn, unknown, V> {
  return dynamicStandardSchemaResolver<V>((data) => {
    const fields = listFormSteps(form, data as Record<string, unknown>)
    return objectFromFields(fields) as unknown as StandardSchemaForResolver
  }) as unknown as Resolver<TIn, unknown, V>
}
