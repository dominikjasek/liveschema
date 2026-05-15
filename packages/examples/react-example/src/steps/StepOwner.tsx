import type { AdoptionForm } from '../formTypes'

export function StepOwner({ form }: { form: AdoptionForm }) {
  return (
    <div>
      <h2>About you</h2>

      <form.Field name="owner.name">
        {(field: {
          state: { value: string | undefined; meta: { errors: unknown[] } }
          handleChange: (v: string) => void
          handleBlur: () => void
        }) => (
          <label className="field">
            <span>Name</span>
            <input
              className="text-input"
              type="text"
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

      <form.Field name="owner.email">
        {(field: {
          state: { value: string | undefined; meta: { errors: unknown[] } }
          handleChange: (v: string) => void
          handleBlur: () => void
        }) => (
          <label className="field">
            <span>Email</span>
            <input
              className="text-input"
              type="email"
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
