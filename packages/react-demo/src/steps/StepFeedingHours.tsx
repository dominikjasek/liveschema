import { feedingHourOptions } from '../schemas'
import type { AdoptionForm } from '../formTypes'

export function StepFeedingHours({ form }: { form: AdoptionForm }) {
  return (
    <div>
      <h2>Pick daily feeding hours (24h clock)</h2>
      <form.Field name="feedingHours">
        {(field: {
          state: { value: number[] | undefined; meta: { errors: unknown[] } }
          handleChange: (v: number[]) => void
        }) => {
          const current = Array.isArray(field.state.value) ? field.state.value : []
          const toggle = (opt: number, checked: boolean) => {
            field.handleChange(
              checked
                ? [...new Set([...current, opt])].sort((a, b) => a - b)
                : current.filter((n) => n !== opt),
            )
          }
          return (
            <>
              <div className="options">
                {feedingHourOptions.map((o) => (
                  <label key={o} className="radio">
                    <input
                      type="checkbox"
                      checked={current.includes(o)}
                      onChange={(e) => toggle(o, e.target.checked)}
                    />
                    <span>{o}</span>
                  </label>
                ))}
              </div>
              {field.state.meta.errors.length > 0 && (
                <p className="error">{String(field.state.meta.errors[0])}</p>
              )}
            </>
          )
        }}
      </form.Field>
    </div>
  )
}
