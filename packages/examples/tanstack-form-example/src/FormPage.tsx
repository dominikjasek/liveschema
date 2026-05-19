import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { activeFields, toStandardSchema } from 'form-flow'
import {
  form as formDef,
  type FormValues,
  type FieldKey,
  animals,
  dogSizes,
} from './schema'

const labels: Record<FieldKey, string> = {
  email: 'Your email',
  havePets: 'Do you have other pets?',
  animal: 'Preffered Animal? 🐶😽',
  dogSize: 'Dog size',
  indoor: 'Indoor cat',
  vipDogQuestion: 'VIP dog question (special access)',
  nameOfYourDog: "What's your dog's name?",
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
        // `value` is narrowed to the cat variant — `indoor` is typed, `dogSize` is not.
        console.log(value.indoor)
      }
      if (value.animal === 'dog' && value.havePets) {
        // Both keys are literal-typed (animal: 'dog' | 'cat', havePets: true | false)
        // → variant is narrowed to the (animal: 'dog', havePets: true) branch,
        // where nameOfYourDog is required.
        console.log(value.nameOfYourDog)
      }
      alert(`Submitted!\n\n${JSON.stringify(value, null, 2)}`)
    },
  })

  const values = useStore(form.store, (state) => state.values)
  const fields = activeFields(formDef, values)

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

              if (key === 'email') {
                return (
                  <form.Field key={key} name="email">
                    {(field) => (
                      <label className="field">
                        <span>{label}</span>
                        <input
                          className="text-input"
                          type="text"
                          value={field.state.value ?? ''}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </label>
                    )}
                  </form.Field>
                )
              }
              
              if (key === 'havePets') {
                return (
                  <form.Field key={key} name="havePets">
                    {(field) => (
                      <div className="field">
                        <label className="confirm">
                          <input
                            type="checkbox"
                            checked={field.state.value === true}
                            onChange={(e) => field.handleChange(e.target.checked)}
                          />
                          <span>{label}</span>
                        </label>
                        <FieldError errors={field.state.meta.errors} />
                      </div>
                    )}
                  </form.Field>
                )
              }

              if (key === 'animal') {
                return (
                  <form.Field key={key} name="animal">
                    {(field) => (
                      <div className="field">
                        <span>{label}</span>
                        <div className="options">
                          {animals.map((o) => (
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
                        <FieldError errors={field.state.meta.errors} />
                      </div>
                    )}
                  </form.Field>
                )
              }

              if (key === 'dogSize') {
                return (
                  <form.Field key={key} name="dogSize">
                    {(field) => (
                      <div className="field">
                        <span>{label}</span>
                        <div className="options">
                          {dogSizes.map((o) => (
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
                        <FieldError errors={field.state.meta.errors} />
                      </div>
                    )}
                  </form.Field>
                )
              }

              if (key === 'indoor') {
                return (
                  <form.Field key={key} name="indoor">
                    {(field) => (
                      <div className="field">
                        <label className="confirm">
                          <input
                            type="checkbox"
                            checked={field.state.value === true}
                            onChange={(e) => field.handleChange(e.target.checked)}
                          />
                          <span>{label}</span>
                        </label>
                        <FieldError errors={field.state.meta.errors} />
                      </div>
                    )}
                  </form.Field>
                )
              }
              
              if (key === 'vipDogQuestion') {
                return (
                  <form.Field key={key} name="vipDogQuestion">
                    {(field) => (
                      <div className="field">
                        <label className="confirm">
                          <input
                            type="checkbox"
                            checked={field.state.value === true}
                            onChange={(e) => field.handleChange(e.target.checked)}
                          />
                          <span>{label}</span>
                        </label>
                        <FieldError errors={field.state.meta.errors} />
                      </div>
                    )}
                  </form.Field>
                )
              }

              if (key === 'nameOfYourDog') {
                return (
                  <form.Field key={key} name="nameOfYourDog">
                    {(field) => (
                      <label className="field">
                        <span>{label}</span>
                        <input
                          className="text-input"
                          type="text"
                          value={field.state.value ?? ''}
                          onChange={(e) => field.handleChange(e.target.value)}
                          onBlur={field.handleBlur}
                        />
                        <FieldError errors={field.state.meta.errors} />
                      </label>
                    )}
                  </form.Field>
                )
              }

              const _exhaustive: never = key
              return _exhaustive
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
