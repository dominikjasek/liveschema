import { useMemo } from 'react'
import { Controller, useForm, useWatch, type Control, type Path } from 'react-hook-form'
import { activeFields, enumOptions } from 'liveschema'
import { form as formDef, type FormValues, type FieldKey } from './schema'
import { liveschemaResolver } from '@liveschema/react-hook-form'

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
  } = useForm<FormValues>({
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
    resolver: liveschemaResolver(formDef),
    shouldUnregister: true,
  })

  const values = useWatch({ control }) as Record<string, unknown>
  const fields = useMemo(() => activeFields(formDef, values), [values])

  const onSubmit = handleSubmit((data) => {
    alert(`Submitted!\n\n${JSON.stringify(data, null, 2)}`)
  })

  const fieldErrors = errors as Partial<Record<FieldKey, { message?: string }>>

  function renderField(key: FieldKey, schema: ReturnType<typeof activeFields>[number]['schema']) {
    const path = key as Path<FormValues>
    const errorMsg = fieldErrors[key]?.message
    const label = labels[key]

    const options = enumOptions(schema)
    if (options) {
      return (
        <ControllerRadio
          key={key}
          control={control}
          name={path}
          label={label}
          options={options}
          errorMsg={errorMsg}
        />
      )
    }

    if (checkboxKeys.has(key)) {
      return (
        <ControllerCheckbox
          key={key}
          control={control}
          name={path}
          label={label}
          errorMsg={errorMsg}
        />
      )
    }

    return (
      <label key={key} className="field">
        <span>{label}</span>
        <input className="text-input" type="text" {...register(path)} />
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
            {fields.map((f) => renderField(f.key as FieldKey, f.schema))}
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
  control: Control<FormValues>
  name: Path<FormValues>
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
  control: Control<FormValues>
  name: Path<FormValues>
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
