import type { AdoptionForm } from '../formTypes'

export function StepNoDogAtHome({ form }: { form: AdoptionForm }) {
  return (
    <div>
      <h2>I confirm I do not own a dog at home (dogs and cats often do not get along).</h2>
      <form.Field name="noDogAtHome">
        {(field: {
          state: { value: true | undefined; meta: { errors: unknown[] } }
          handleChange: (v: true | undefined) => void
        }) => (
          <>
            <label className="confirm">
              <input
                type="checkbox"
                checked={field.state.value === true}
                onChange={(e) =>
                  field.handleChange(e.target.checked ? true : undefined)
                }
              />
              <span>I confirm</span>
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
