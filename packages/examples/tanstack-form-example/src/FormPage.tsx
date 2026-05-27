import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { activeFields, enumOptions, toStandardSchema } from '@liveschema/core'
import {
  form as formDef,
  type FormValues,
  type FormValuesFlat,
  type FieldKey,
} from './schema'

const labels: Record<FieldKey, string> = {
  email: 'Your email',
  fullName: 'Full name',
  orderType: 'How would you like to receive your order?',
  leaveAtDoor: 'Leave at the door if no answer?',
  hasOrderedBefore: 'Have you ordered from us before?',
  favoriteItem: 'Your favorite item from last time',
  mainCourse: 'Main course',
  pizzaSize: 'Pizza size',
  toppings: 'Toppings (comma-separated)',
  pizzaCount: 'How many pizzas?',
  requestedReadyTime: 'When should it be ready? (3+ pizzas need 30+ min prep)',
  dressingOnSide: 'Dressing on the side?',
  needsNapkins: 'Include extra napkins?',
  napkinCount: 'How many extra napkins?',
}

const standardSchema = toStandardSchema(formDef)

export function FormPage() {
  const form = useForm({
    defaultValues: {
      email: '',
      fullName: '',
      orderType: 'pickup',
      hasOrderedBefore: false,
      mainCourse: 'pizza',
      pizzaSize: 'small',
      toppings: '',
    } as FormValuesFlat,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: standardSchema,
    },
    onSubmit: ({ value }) => {
      // `value` is the flat form-state shape; validation guarantees the
      // submitted data conforms to the discriminated union — narrow there.
      const data = value as FormValues
      if (data.mainCourse === 'pizza') {
        if (data.pizzaCount > 8) {
          console.log(data.requestedReadyTime) // this can not be infered because of dynamic check of count
        }
      }
      if (data.orderType === 'delivery') {
        if (data.needsNapkins) {
          console.log(data.napkinCount) // this can not be infered because of dynamic check of needsNapkins
        }
      }
      alert(`Submitted!\n\n${JSON.stringify(data, null, 2)}`)
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

  const renderRadio = (name: FieldKey, label: string, options: readonly string[]) => (
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
        <h1>Tanstack Form</h1>
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
                key === 'leaveAtDoor' ||
                key === 'hasOrderedBefore' ||
                key === 'dressingOnSide' ||
                key === 'needsNapkins'
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
