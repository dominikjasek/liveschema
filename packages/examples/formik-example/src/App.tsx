import { useMemo } from 'react'
import { useFormik } from 'formik'
import { listFormSteps, reachableKeys, validateForm, type FormKeys } from 'form-flow'
import { form as formDef, type FormValues, animals, dogSizes } from './schema'

type FieldKey = FormKeys<typeof formDef>

const labels: Record<FieldKey, string> = {
  email: 'Your email',
  animal: 'Animal',
  dogSize: 'Dog size',
  indoor: 'Indoor cat',
}

export function App() {
  const formik = useFormik<Partial<FormValues>>({
    initialValues: {} as Partial<FormValues>,
    validate: (values) => validateForm(formDef, values),
    onSubmit: (data) => {
      const keep = reachableKeys(formDef, data as Record<string, unknown>)
      console.log('Reachable keys at submit:', keep, data)
      const clean = Object.fromEntries(Object.entries(data).filter(([k]) => keep.has(k)))
      alert(`Submitted!\n\n${JSON.stringify(clean, null, 2)}`)
    },
  })

  const { values, errors, touched, setFieldValue, handleBlur, handleChange, handleSubmit } = formik

  const fields = useMemo(() => listFormSteps(formDef, values as Record<string, unknown>), [values])

  function errorFor(key: FieldKey): string | undefined {
    const errs = errors as Partial<Record<FieldKey, string>>
    const touch = touched as Partial<Record<FieldKey, boolean>>
    return touch[key] ? errs[key] : undefined
  }

  function renderField(key: FieldKey) {
    const errorMsg = errorFor(key)
    const label = labels[key]

    if (key === 'email') {
      return (
        <label key={key} className="field">
          <span>{label}</span>
          <input
            className="text-input"
            type="text"
            name={key}
            value={(values.email as string | undefined) ?? ''}
            onChange={handleChange}
            onBlur={handleBlur}
          />
          {errorMsg && <p className="error">{errorMsg}</p>}
        </label>
      )
    }

    if (key === 'animal') {
      return (
        <RadioField
          key={key}
          name={key}
          label={label}
          options={animals}
          value={values.animal as string | undefined}
          onChange={(v) => setFieldValue(key, v, true)}
          errorMsg={errorMsg}
        />
      )
    }

    if (key === 'dogSize') {
      return (
        <RadioField
          key={key}
          name={key}
          label={label}
          options={dogSizes}
          value={(values as { dogSize?: string }).dogSize}
          onChange={(v) => setFieldValue(key, v, true)}
          errorMsg={errorMsg}
        />
      )
    }

    if (key === 'indoor') {
      return (
        <CheckboxField
          key={key}
          name={key}
          label={label}
          value={(values as { indoor?: boolean }).indoor === true}
          onChange={(v) => setFieldValue(key, v, true)}
          errorMsg={errorMsg}
        />
      )
    }

    const _exhaustive: never = key
    return _exhaustive
  }

  return (
    <>
      <header>
        <h1>Adopt an Animal</h1>
      </header>
      <main>
        <section className="form-single">
          <form className="form-fields" onSubmit={handleSubmit}>
            {fields.map((f) => renderField(f.key as FieldKey))}
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

type RadioFieldProps = {
  name: string
  label: string
  options: readonly string[]
  value: string | undefined
  onChange: (value: string) => void
  errorMsg?: string
}

function RadioField({ name, label, options, value, onChange, errorMsg }: RadioFieldProps) {
  return (
    <div className="field">
      <span>{label}</span>
      <div className="options">
        {options.map((o) => (
          <label key={o} className="radio">
            <input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
      {errorMsg && <p className="error">{errorMsg}</p>}
    </div>
  )
}

type CheckboxFieldProps = {
  name: string
  label: string
  value: boolean
  onChange: (value: boolean) => void
  errorMsg?: string
}

function CheckboxField({ name, label, value, onChange, errorMsg }: CheckboxFieldProps) {
  return (
    <div className="field">
      <label className="confirm">
        <input
          type="checkbox"
          name={name}
          checked={value}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>{label}</span>
      </label>
      {errorMsg && <p className="error">{errorMsg}</p>}
    </div>
  )
}
