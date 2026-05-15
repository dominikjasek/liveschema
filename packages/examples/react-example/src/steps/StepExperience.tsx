import { previousAnimalOptions } from '../schemas'
import type { AdoptionForm } from '../formTypes'

export function StepExperience({ form }: { form: AdoptionForm }) {
  return (
    <div>
      <h2>Your experience with pets</h2>

      <form.Field name="experience.yearsOwnedPets">
        {(field: {
          state: { value: number | undefined; meta: { errors: unknown[] } }
          handleChange: (v: number | undefined) => void
        }) => (
          <label className="field">
            <span>Years owning pets</span>
            <input
              className="number-input"
              type="number"
              min={0}
              max={80}
              value={typeof field.state.value === 'number' ? field.state.value : ''}
              onChange={(e) => {
                const n = (e.target as HTMLInputElement).valueAsNumber
                field.handleChange(Number.isNaN(n) ? undefined : n)
              }}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="error">{String(field.state.meta.errors[0])}</p>
            )}
          </label>
        )}
      </form.Field>

      <form.Field name="experience.previousAnimal">
        {(field: {
          state: { value: string | undefined; meta: { errors: unknown[] } }
          handleChange: (v: string) => void
        }) => (
          <div className="field">
            <span>Previous pet</span>
            <div className="options">
              {previousAnimalOptions.map((o) => (
                <label key={o} className="radio">
                  <input
                    type="radio"
                    checked={field.state.value === o}
                    onChange={() => field.handleChange(o)}
                  />
                  <span>{o}</span>
                </label>
              ))}
            </div>
            {field.state.meta.errors.length > 0 && (
              <p className="error">{String(field.state.meta.errors[0])}</p>
            )}
          </div>
        )}
      </form.Field>
    </div>
  )
}
