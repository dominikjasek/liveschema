import { Controller, useForm, useWatch, type Control } from 'react-hook-form'
import { standardSchemaResolver } from '@hookform/resolvers/standard-schema'
import { toStandardSchema } from '@liveschema/core'
import { useLiveSchema } from '@liveschema/react'
import { form as formDef, type FormValuesFlat, type FieldKey } from './schema'

const standardSchema = toStandardSchema(formDef)

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

const checkboxKeys = new Set<FieldKey>([
  'leaveAtDoor',
  'hasOrderedBefore',
  'dressingOnSide',
  'needsNapkins',
])

export function App() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValuesFlat>({
    defaultValues: {
      email: '',
      fullName: '',
      orderType: 'pickup',
      hasOrderedBefore: false,
      mainCourse: 'pizza',
      pizzaSize: 'small',
      toppings: '',
    },
    mode: 'all',
    resolver: standardSchemaResolver(standardSchema),
    shouldUnregister: false,
  })

  const values = useWatch({ control })
  const { fields, isActiveField } = useLiveSchema(formDef, values)
  const fieldEntries = Object.entries(fields) as [FieldKey, (typeof fields)[FieldKey]][]

  const onSubmit = handleSubmit((data) => {
    alert(`Submitted!\n\n${JSON.stringify(data, null, 2)}`)
  })

  function renderField(key: FieldKey, enumOpts: readonly string[] | undefined) {
    if (!isActiveField(key)) return null
    const errorMsg = errors[key]?.message
    const label = labels[key]

    if (enumOpts) {
      return (
        <ControllerRadio
          key={key}
          control={control}
          name={key}
          label={label}
          options={enumOpts}
          errorMsg={errorMsg}
        />
      )
    }

    if (checkboxKeys.has(key)) {
      return (
        <ControllerCheckbox
          key={key}
          control={control}
          name={key}
          label={label}
          errorMsg={errorMsg}
        />
      )
    }

    return (
      <label key={key} className="field">
        <span>{label}</span>
        <input className="text-input" type="text" {...register(key)} />
        {errorMsg && <p className="error">{errorMsg}</p>}
      </label>
    )
  }

  return (
    <>
      <header>
        <h1>React hook form</h1>
      </header>
      <main>
        <section className="form-single">
          <form className="form-fields" onSubmit={onSubmit}>
            {fieldEntries.map(([key, info]) =>
              renderField(key, 'enumOptions' in info ? info.enumOptions : undefined),
            )}
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

type ControllerRadioProps = {
  control: Control<FormValuesFlat>
  name: FieldKey
  label: string
  options: readonly string[]
  errorMsg?: string
}

function ControllerRadio({ control, name, label, options, errorMsg }: ControllerRadioProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="field">
          <span>{label}</span>
          <div className="options">
            {options.map((o) => (
              <label key={o} className="radio">
                <input
                  type="radio"
                  checked={field.value === o}
                  onChange={() => field.onChange(o)}
                />
                <span>{o}</span>
              </label>
            ))}
          </div>
          {errorMsg && <p className="error">{errorMsg}</p>}
        </div>
      )}
    />
  )
}

type ControllerCheckboxProps = {
  control: Control<FormValuesFlat>
  name: FieldKey
  label: string
  errorMsg?: string
}

function ControllerCheckbox({ control, name, label, errorMsg }: ControllerCheckboxProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className="field">
          <label className="confirm">
            <input
              type="checkbox"
              checked={field.value === true}
              onChange={(e) => field.onChange(e.target.checked)}
            />
            <span>{label}</span>
          </label>
          {errorMsg && <p className="error">{errorMsg}</p>}
        </div>
      )}
    />
  )
}
