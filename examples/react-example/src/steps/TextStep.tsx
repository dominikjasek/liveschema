import type { AdoptionForm } from '../formTypes'

type Props = {
  form: AdoptionForm
  path: string
  question: string
  type?: 'text' | 'email'
}

export function TextStep({ form, path, question, type = 'text' }: Props) {
  return (
    <div>
      <h2>{question}</h2>
      <form.Field name={path}>
        {(field: {
          state: { value: string | undefined; meta: { errors: unknown[] } }
          handleChange: (v: string) => void
          handleBlur: () => void
        }) => (
          <label className="field">
            <input
              className="text-input"
              type={type}
              value={(field.state.value as string | undefined) ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="error">{String(field.state.meta.errors[0])}</p>
            )}
          </label>
        )}
      </form.Field>
    </div>
  )
}
