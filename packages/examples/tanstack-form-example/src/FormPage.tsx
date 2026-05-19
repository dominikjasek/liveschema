import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { activeFields, enumOptions, toStandardSchema } from 'form-flow'
import { form as formDef, type FormValues, type FieldKey } from './schema'

const labels: Record<FieldKey, string> = {
  email: 'Your email',
  fullName: 'Full name',
  housingType: 'Where do you live?',
  hasYard: 'Do you have a yard?',
  hasPriorPetExperience: 'Have you owned a pet before?',
  priorPetName: "Your previous pet's name",
  animal: 'Which animal would you like to adopt? 🐶😽',
  dogSize: 'Preferred dog size',
  dogName: 'What will you name the dog?',
  catIndoor: 'Will the cat be indoor only?',
  needsHomeVisit: "OK with a home visit before we approve?",
}

const standardSchema = toStandardSchema<FormValues, FormValues>(formDef)

export function FormPage() {
  const form = useForm({
    defaultValues: {} as FormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: standardSchema,
    },
    onSubmit: ({ value }) => {
      if (value.animal === 'cat') {
        // `value` is narrowed to the cat variant — `catIndoor` is typed.
        console.log(value.catIndoor)
      }
      if (value.animal === 'dog') {
        // Narrowed to the dog variant — `dogSize` and `dogName` are required.
        console.log(value.dogSize, value.dogName)
      }
      if (value.hasPriorPetExperience) {
        // Narrowed: `priorPetName` is required when the user has prior experience.
        console.log(value.priorPetName)
      }
      alert(`Submitted!\n\n${JSON.stringify(value, null, 2)}`)
    },
  })

  const values = useStore(form.store, (state) => state.values)
  const fields = activeFields(formDef, values)

  const renderText = (name: FieldKey, label: string) => (
    <form.Field key={name} name={name as never}>
      {(field) => (
        <label className="field">
          <span>{label}</span>
          <input
            className="text-input"
            type="text"
            value={(field.state.value as string | undefined) ?? ''}
            onChange={(e) => field.handleChange(e.target.value as never)}
            onBlur={field.handleBlur}
          />
          <FieldError errors={field.state.meta.errors} />
        </label>
      )}
    </form.Field>
  )

  const renderCheckbox = (name: FieldKey, label: string) => (
    <form.Field key={name} name={name as never}>
      {(field) => (
        <div className="field">
          <label className="confirm">
            <input
              type="checkbox"
              checked={field.state.value === true}
              onChange={(e) => field.handleChange(e.target.checked as never)}
            />
            <span>{label}</span>
          </label>
          <FieldError errors={field.state.meta.errors} />
        </div>
      )}
    </form.Field>
  )

  const renderRadio = (
    name: FieldKey,
    label: string,
    options: readonly string[],
  ) => (
    <form.Field key={name} name={name as never}>
      {(field) => (
        <div className="field">
          <span>{label}</span>
          <div className="options">
            {options.map((o) => (
                <label key={o} className="radio">
                  <input
                    type="radio"
                    checked={field.state.value === o}
                    onChange={() => field.handleChange(o as never)}
                  />
                  <span>{o}</span>
                </label>
              ))}
          </div>
          <FieldError errors={field.state.meta.errors} />
        </div>
      )}
    </form.Field>
  )

  return (
    <>
      <header>
        <h1>Adopt an Animal with Tanstack Form</h1>
      </header>
      <main>
        <section className="form-single">
          <form
            className="form-fields"
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              void form.handleSubmit()
            }}
          >
            {fields.map((f) => {
              const key = f.key
              const label = labels[key]
              const options = enumOptions(f.schema)
              if (options) return renderRadio(key, label, options)
              if (
                key === 'hasYard' ||
                key === 'hasPriorPetExperience' ||
                key === 'catIndoor' ||
                key === 'needsHomeVisit'
              ) {
                return renderCheckbox(key, label)
              }
              return renderText(key, label)
            })}
            <div className="actions">
              <button type="submit">Submit</button>
            </div>
          </form>
          <pre className="debug">{JSON.stringify(values, null, 2)}</pre>
        </section>
      </main>
    </>
  )
}

type FieldErrorProps = { errors: ReadonlyArray<unknown> }

function FieldError({ errors }: FieldErrorProps) {
  const first = errors[0]
  if (first == null) return null
  const message =
    typeof first === 'object' && first !== null && 'message' in first
      ? String((first as { message: unknown }).message)
      : String(first)
  return <p className="error">{message}</p>
}
