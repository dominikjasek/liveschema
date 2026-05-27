import type { AdoptionForm } from '../formTypes'

type Props = {
  form: AdoptionForm
  path: string
  question: string
  confirmLabel?: string
}

export function CheckboxStep({ form, path, question, confirmLabel = 'Yes' }: Props) {
  return (
    <div>
      <h2>{question}</h2>
      <form.Field name={path}>
        {(field: {
          state: { value: boolean | undefined; meta: { errors: unknown[] } }
          handleChange: (v: boolean) => void
        }) => (
          <>
            <label className="confirm">
              <input
                type="checkbox"
                checked={field.state.value === true}
                onChange={(e) => field.handleChange(e.target.checked)}
              />
              <span>{confirmLabel}</span>
            </label>
            {field.state.meta.errors.length > 0 && (
              <p className="error">{String(field.state.meta.errors[0])}</p>
            )}
          </>
        )}
      </form.Field>
    </div>
  )
}
