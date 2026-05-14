import type { AdoptionForm } from '../formTypes'

type Props<T extends string | number> = {
  form: AdoptionForm
  path: string
  question: string
  options: readonly T[]
}

export function RadioStep<T extends string | number>({
  form,
  path,
  question,
  options,
}: Props<T>) {
  return (
    <div>
      <h2>{question}</h2>
      <form.Field name={path}>
        {(field: {
          state: { value: T | undefined; meta: { errors: unknown[] } }
          handleChange: (v: T) => void
        }) => (
          <>
            <div className="options">
              {options.map((o) => (
                <label key={String(o)} className="radio">
                  <input
                    type="radio"
                    checked={field.state.value === o}
                    onChange={() => field.handleChange(o)}
                  />
                  <span>{String(o)}</span>
                </label>
              ))}
            </div>
            {field.state.meta.errors.length > 0 && (
              <p className="error">{String(field.state.meta.errors[0])}</p>
            )}
          </>
        )}
      </form.Field>
    </div>
  )
}
