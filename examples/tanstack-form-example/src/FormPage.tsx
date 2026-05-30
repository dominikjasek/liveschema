import { revalidateLogic, useForm, useStore } from '@tanstack/react-form'
import { toStandardSchema } from '@liveschema/core'
import { useLiveSchema } from '@liveschema/react'
import { form as formDef, type FormValues, type FormValuesFlat, type FieldKey } from './schema'

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
  napkin: 'How many extra napkins?',
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
          console.log(data.napkin.count) // this can not be infered because of dynamic check of needsNapkins
        }
      }
      alert(`Submitted!\n\n${JSON.stringify(data, null, 2)}`)
    },
  })

  const values = useStore(form.store, (state) => state.values)
  const { fields } = useLiveSchema(formDef, values)

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
            {fields.email.isReachable && (
              <form.Field name="email">
                {(field) => (
                  <label className="field">
                    <span>{labels.email}</span>
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
            )}
            {fields.fullName.isReachable && (
              <form.Field name="fullName">
                {(field) => (
                  <label className="field">
                    <span>{labels.fullName}</span>
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
            )}
            {fields.orderType.isReachable && (
              <form.Field name="orderType">
                {(field) => (
                  <div className="field">
                    <span>{labels.orderType}</span>
                    <div className="options">
                      {(fields.orderType.enumOptions ?? []).map((o) => (
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
            )}
            {fields.leaveAtDoor.isReachable && (
              <form.Field name="leaveAtDoor">
                {(field) => (
                  <div className="field">
                    <label className="confirm">
                      <input
                        type="checkbox"
                        checked={field.state.value === true}
                        onChange={(e) => field.handleChange(e.target.checked)}
                      />
                      <span>{labels.leaveAtDoor}</span>
                    </label>
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>
            )}
            {fields.hasOrderedBefore.isReachable && (
              <form.Field name="hasOrderedBefore">
                {(field) => (
                  <div className="field">
                    <label className="confirm">
                      <input
                        type="checkbox"
                        checked={field.state.value === true}
                        onChange={(e) => field.handleChange(e.target.checked)}
                      />
                      <span>{labels.hasOrderedBefore}</span>
                    </label>
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>
            )}
            {fields.favoriteItem.isReachable && (
              <form.Field name="favoriteItem">
                {(field) => (
                  <label className="field">
                    <span>{labels.favoriteItem}</span>
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
            )}
            {fields.mainCourse.isReachable && (
              <form.Field name="mainCourse">
                {(field) => (
                  <div className="field">
                    <span>{labels.mainCourse}</span>
                    <div className="options">
                      {(fields.mainCourse.enumOptions ?? []).map((o) => (
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
            )}
            {fields.pizzaSize.isReachable && (
              <form.Field name="pizzaSize">
                {(field) => (
                  <div className="field">
                    <span>{labels.pizzaSize}</span>
                    <div className="options">
                      {(fields.pizzaSize.enumOptions ?? []).map((o) => (
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
            )}
            {fields.toppings.isReachable && (
              <form.Field name="toppings">
                {(field) => (
                  <label className="field">
                    <span>{labels.toppings}</span>
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
            )}
            {fields.pizzaCount.isReachable && (
              <form.Field name="pizzaCount">
                {(field) => (
                  <label className="field">
                    <span>{labels.pizzaCount}</span>
                    <input
                      className="text-input"
                      type="text"
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.value as never)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </label>
                )}
              </form.Field>
            )}
            {fields.requestedReadyTime.isReachable && (
              <form.Field name="requestedReadyTime">
                {(field) => (
                  <label className="field">
                    <span>{labels.requestedReadyTime}</span>
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
            )}
            {fields.dressingOnSide.isReachable && (
              <form.Field name="dressingOnSide">
                {(field) => (
                  <div className="field">
                    <label className="confirm">
                      <input
                        type="checkbox"
                        checked={field.state.value === true}
                        onChange={(e) => field.handleChange(e.target.checked)}
                      />
                      <span>{labels.dressingOnSide}</span>
                    </label>
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>
            )}
            {fields.needsNapkins.isReachable && (
              <form.Field name="needsNapkins">
                {(field) => (
                  <div className="field">
                    <label className="confirm">
                      <input
                        type="checkbox"
                        checked={field.state.value === true}
                        onChange={(e) => field.handleChange(e.target.checked)}
                      />
                      <span>{labels.needsNapkins}</span>
                    </label>
                    <FieldError errors={field.state.meta.errors} />
                  </div>
                )}
              </form.Field>
            )}
            {fields.napkin.isReachable && (
              <form.Field name="napkin.count">
                {(field) => (
                  <label className="field">
                    <span>{labels.napkin}</span>
                    <input
                      className="text-input"
                      type="text"
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.value as never)}
                      onBlur={field.handleBlur}
                    />
                    <FieldError errors={field.state.meta.errors} />
                  </label>
                )}
              </form.Field>
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
