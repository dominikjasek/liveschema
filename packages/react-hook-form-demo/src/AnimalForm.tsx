import { useMemo } from 'react'
import { Controller, useForm, type Control, type Path } from 'react-hook-form'
import { listFormSteps, type FormKeys } from 'zod-form-flow'
import { form as formDef, type FormValues, animals, dogSizes } from './schema'

type DraftValues = Partial<FormValues>
type FieldKey = FormKeys<typeof formDef>

const labels: Record<FieldKey, string> = {
  name: 'Your name',
  animal: 'Animal',
  dogSize: 'Dog size',
  indoor: 'Indoor cat',
}

export function AnimalForm() {
  const {
    register,
    control,
    watch,
    setError,
    clearErrors,
    handleSubmit,
    formState: { errors },
  } = useForm<DraftValues>({
    defaultValues: {},
    mode: 'onSubmit',
    shouldUnregister: true,
  })

  const values = watch() as Record<string, unknown>
  const fields = useMemo(() => listFormSteps(formDef, values), [values])

  const onSubmit = handleSubmit((data) => {
    let hasError = false
    for (const { key, schema } of fields) {
      const path = key as Path<DraftValues>
      const result = schema.safeParse((data as Record<string, unknown>)[key])
      if (!result.success) {
        setError(path, { type: 'zod', message: result.error.issues[0].message })
        hasError = true
      } else {
        clearErrors(path)
      }
    }
    if (hasError) return
    // eslint-disable-next-line no-alert
    alert(`Submitted!\n\n${JSON.stringify(data, null, 2)}`)
  })

  const fieldErrors = errors as Partial<Record<FieldKey, { message?: string }>>

  function renderField(key: FieldKey) {
    const path = key as Path<DraftValues>
    const errorMsg = fieldErrors[key]?.message
    const label = labels[key]

    if (key === 'name') {
      return (
        <label key={key} className="field">
          <span>{label}</span>
          <input className="text-input" type="text" {...register(path)} />
          {errorMsg && <p className="error">{errorMsg}</p>}
        </label>
      )
    }

    if (key === 'animal') {
      return (
        <ControllerRadio
          key={key}
          control={control}
          name={path}
          label={label}
          options={animals}
          errorMsg={errorMsg}
        />
      )
    }

    if (key === 'dogSize') {
      return (
        <ControllerRadio
          key={key}
          control={control}
          name={path}
          label={label}
          options={dogSizes}
          errorMsg={errorMsg}
        />
      )
    }

    if (key === 'indoor') {
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

    const _exhaustive: never = key
    return _exhaustive
  }

  return (
    <section className="form-single">
      <form className="form-fields" onSubmit={onSubmit}>
        {fields.map((f) => renderField(f.key))}
        <div className="actions">
          <button type="submit">Submit</button>
        </div>
      </form>
      <pre className="debug">{JSON.stringify(values, null, 2)}</pre>
    </section>
  )
}

type ControllerRadioProps = {
  control: Control<DraftValues>
  name: Path<DraftValues>
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
  control: Control<DraftValues>
  name: Path<DraftValues>
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
