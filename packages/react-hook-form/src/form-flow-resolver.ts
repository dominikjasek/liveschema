import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type { FieldValues, Resolver } from 'react-hook-form'
import { listFormSteps, type FormBuilder } from 'form-flow'

/**
 * Assemble the currently-reachable fields into a single Standard Schema
 * object validator. Mirrors `z.object(...)` / `v.object(...)` but built from
 * the spec directly so the resolver depends on no specific validation lib.
 */
function objectFromFields<TIn extends FieldValues, V>(
  fields: ReadonlyArray<{ key: string; schema: StandardSchemaV1 }>,
): StandardSchemaV1<TIn, V> {
  return {
    '~standard': {
      version: 1,
      vendor: 'form-flow',
      validate(input) {
        if (input === null || typeof input !== 'object') {
          return { issues: [{ message: 'Expected object' }] }
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

        const finalize = (): StandardSchemaV1.Result<V> =>
          issues.length ? { issues } : { value: out as V }

        if (pending.length > 0) return Promise.all(pending).then(finalize)
        return finalize()
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
 * Build a react-hook-form `Resolver` from a `form-flow` form definition.
 *
 * On every validation cycle it re-computes the active field set
 * (`listFormSteps(form, currentValues)`) and assembles a Standard Schema
 * object of those fields' schemas. The active fields — and therefore the
 * validated shape — change as the user answers branching questions.
 */
export function formFlowResolver<
  V extends object,
  TIn extends FieldValues = Partial<V> & FieldValues,
>(form: FormBuilder<V>): Resolver<TIn, unknown, V> {
  return (data, ctx, opts) => {
    const fields = listFormSteps(form, data)
    const schema = objectFromFields<TIn, V>(fields)
    return standardSchemaResolver<TIn, unknown, V>(schema)(data, ctx, opts)
  }
}
