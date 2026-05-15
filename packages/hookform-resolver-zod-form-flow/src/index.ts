import type { FieldErrors, Resolver } from 'react-hook-form'
import { z } from 'zod'
import { listFormSteps, type FormBuilder } from 'zod-form-flow'

/**
 * Build a react-hook-form `Resolver` from a `zod-form-flow` form definition.
 *
 * On every validation cycle the resolver re-computes the active field set
 * (`listFormSteps(form, currentValues)`), assembles an ad-hoc `z.object`
 * from those fields' schemas, and validates `data` against it. Issues are
 * mapped into RHF's nested `FieldErrors` shape preserving Zod's `path`.
 *
 * Mirrors the shape of `@hookform/resolvers/zod`'s `zodResolver(schema)` so
 * usage is idiomatic for RHF users.
 */
export function zodFormFlowResolver<V extends object>(
  form: FormBuilder<V>,
): Resolver<Partial<V>, unknown, V> {
  return (data) => {
    const fields = listFormSteps(form, data as Record<string, unknown>)
    const schema = z.object(Object.fromEntries(fields.map((f) => [f.key, f.schema])))
    const result = schema.safeParse(data)
    if (result.success) return { values: result.data as V, errors: {} }
    const errors = {} as FieldErrors<Partial<V>>
    for (const issue of result.error.issues) {
      setLeafError(errors, issue.path, { type: 'zod', message: issue.message })
    }
    return { values: {}, errors }
  }
}

function setLeafError(
  target: Record<string, unknown>,
  path: ReadonlyArray<PropertyKey>,
  err: { type: string; message: string },
): void {
  if (path.length === 0) return
  let curr = target
  for (let i = 0; i < path.length - 1; i++) {
    const k = String(path[i])
    const next = curr[k]
    if (next == null || typeof next !== 'object') curr[k] = {}
    curr = curr[k] as Record<string, unknown>
  }
  const leaf = String(path[path.length - 1])
  if (!(leaf in curr)) curr[leaf] = err
}
