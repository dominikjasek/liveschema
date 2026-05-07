import { z } from 'zod'
import { adoptionSchema } from '@/schemas'

export type Step = {
  field: string
  path: string  // dotted path for vee-validate (e.g. 'branch.branch.trainingGoal')
  schema: z.ZodType
  value: unknown
}

/**
 * Walk the adoption Zod schema and produce the ordered list of user-facing
 * steps reachable from the current form values. The walker treats:
 *   - z.intersection           → walk left, then right
 *   - z.discriminatedUnion     → discriminator field is the next step; once
 *                                its value is set, descend into the matching
 *                                option's remaining fields
 *   - z.object                 → walk fields in declaration order; literal
 *                                fields (already determined) are skipped;
 *                                compound fields are recursed into
 *   - leaf field (enum/number/string/array/literal-true/...)
 *                              → emitted as a step
 */
export function listSteps(values: unknown): Step[] {
  const out: Step[] = []
  walk(adoptionSchema, values, [], out)
  return out
}

function walk(schema: z.ZodType, value: unknown, path: string[], out: Step[]): void {
  const def = (schema as { def?: { type?: string } }).def
  const type = def?.type

  if (type === 'intersection' || schema instanceof z.ZodIntersection) {
    const d = (schema as unknown as { def: { left: z.ZodType; right: z.ZodType } }).def
    walk(d.left, value, path, out)
    walk(d.right, value, path, out)
    return
  }

  if (schema instanceof z.ZodDiscriminatedUnion) {
    const d = (schema as unknown as {
      def: { discriminator: string; options: ReadonlyArray<z.ZodObject<z.ZodRawShape>> }
    }).def
    const disc = d.discriminator
    const options = d.options
    const allowed = options.map((o) => literalValueOf(o.shape[disc])) as string[]
    out.push({
      field: disc,
      path: [...path, disc].join('.'),
      schema: z.enum(allowed as [string, ...string[]]),
      value: getAt(value, disc),
    })
    const v = getAt(value, disc)
    if (v === undefined) return
    const matched = options.find((o) => literalValueOf(o.shape[disc]) === v)
    if (matched) walkObject(matched, value, path, out, disc)
    return
  }

  if (schema instanceof z.ZodObject) {
    walkObject(schema as z.ZodObject<z.ZodRawShape>, value, path, out)
    return
  }
}

function walkObject(
  obj: z.ZodObject<z.ZodRawShape>,
  value: unknown,
  path: string[],
  out: Step[],
  skipKey?: string,
): void {
  for (const [key, fieldSchema] of Object.entries(obj.shape)) {
    if (skipKey && key === skipKey) continue
    if (fieldSchema instanceof z.ZodLiteral) {
      if (literalValueOf(fieldSchema) === true) {
        // boolean confirmation field — user-facing checkbox step
        out.push({
          field: key,
          path: [...path, key].join('.'),
          schema: fieldSchema,
          value: getAt(value, key),
        })
      }
      continue
    }
    if (
      fieldSchema instanceof z.ZodObject ||
      fieldSchema instanceof z.ZodDiscriminatedUnion ||
      fieldSchema instanceof z.ZodIntersection
    ) {
      walk(fieldSchema as z.ZodType, getAt(value, key), [...path, key], out)
    } else {
      out.push({
        field: key,
        path: [...path, key].join('.'),
        schema: fieldSchema as z.ZodType,
        value: getAt(value, key),
      })
    }
  }
}

function literalValueOf(schema: unknown): unknown {
  const v = (schema as { value?: unknown; def?: { values?: unknown[] } })
  if ('value' in v && v.value !== undefined) return v.value
  return v.def?.values?.[0]
}

function getAt(obj: unknown, key: string): unknown {
  if (obj === null || typeof obj !== 'object') return undefined
  return (obj as Record<string, unknown>)[key]
}

/** Wrap a leaf schema with the nested-object structure implied by a dotted path. */
export function schemaAtPath(path: string, leaf: z.ZodType): z.ZodType {
  const parts = path.split('.')
  let acc: z.ZodType = leaf
  for (let i = parts.length - 1; i >= 0; i--) {
    acc = z.object({ [parts[i]]: acc })
  }
  return acc
}
