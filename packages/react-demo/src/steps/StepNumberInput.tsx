import type { AdoptionForm } from '../formTypes'

type Props = {
  form: AdoptionForm
  path: string
  question: string
  min?: number
  max?: number
}

export function StepNumberInput({ form, path, question, min, max }: Props) {
  return (
    <div>
      <h2>{question}</h2>
      <form.Field name={path}>
        {(field: {
          state: { value: number | undefined; meta: { errors: unknown[] } }
          handleChange: (v: number | undefined) => void
        }) => (
          <>
            <input
              className="number-input"
              type="number"
              min={min}
              max={max}
              value={typeof field.state.value === 'number' ? field.state.value : ''}
              onChange={(e) => {
                const n = (e.target as HTMLInputElement).valueAsNumber
                field.handleChange(Number.isNaN(n) ? undefined : n)
              }}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="error">{String(field.state.meta.errors[0])}</p>
            )}
          </>
        )}
      </form.Field>
    </div>
  )
}
