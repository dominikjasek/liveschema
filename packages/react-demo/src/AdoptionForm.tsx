import { useEffect, useMemo, useState } from 'react'
import { useForm, useStore } from '@tanstack/react-form'
import { listFormSteps, type FormStep } from 'zod-form-flow'
import { form as formDef, type Adoption } from './schemas'
import { stepRenderers } from './steps'
import { StepReview } from './StepReview'
import { humanize } from './stepLabels'

type Phase = 'fill' | 'review'

export function AdoptionForm() {
  const [phase, setPhase] = useState<Phase>('fill')
  const [stepIndex, setStepIndex] = useState(0)

  const form = useForm({
    defaultValues: {} as Partial<Adoption>,
    onSubmit: ({ value }) => {
      // eslint-disable-next-line no-alert
      alert(`Adoption submitted!\n\n${JSON.stringify(value, null, 2)}`)

      if (value.animalType === "dog") {
        if (value.dogSize === "large") {
          console.log("big doggie")
        }
      }
    },
  })

  // Subscribe to values — every value change re-derives the step list.
  const values = useStore(form.store, (s) => s.values) as Record<string, unknown>

  const steps: FormStep[] = useMemo(() => listFormSteps(formDef, values), [values])
  console.log('steps', steps)

  // Clamp stepIndex if a branch change shrinks the step list.
  const clampedIndex = Math.min(stepIndex, Math.max(0, steps.length - 1))
  useEffect(() => {
    if (phase === 'fill' && clampedIndex !== stepIndex) {
      setStepIndex(clampedIndex)
    }
  }, [clampedIndex, stepIndex, phase])

  const currentStep = phase === 'fill' ? steps[clampedIndex] : undefined
  const stepLabels = useMemo(() => [...steps.map((s) => s.key), 'review'], [steps])
  const activeIndex = phase === 'review' ? stepLabels.length - 1 : clampedIndex

  async function goNext() {
    if (!currentStep) return
    const value = (values as Record<string, unknown>)[currentStep.key]
    const result = currentStep.schema.safeParse(value)
    if (!result.success) {
      // Push issues onto the matching TanStack field's error list.
      for (const issue of result.error.issues) {
        const fieldName = issue.path.length
          ? `${currentStep.key}.${issue.path.join('.')}`
          : currentStep.key
        form.setFieldMeta(fieldName as never, ((m: Record<string, unknown>) => ({
          ...m,
          errors: [issue.message],
          errorMap: { onChange: issue.message },
        })) as never)
      }
      return
    }
    // Persist parsed value (handles coercion, e.g. number).
    form.setFieldValue(currentStep.key as never, result.data as never)
    // Clear any prior errors for this step.
    form.setFieldMeta(currentStep.key as never, ((m: Record<string, unknown>) => ({
      ...m,
      errors: [],
      errorMap: {},
    })) as never)
    if (clampedIndex < steps.length - 1) {
      setStepIndex(clampedIndex + 1)
    } else {
      setPhase('review')
    }
  }

  function goBack() {
    if (phase === 'review') {
      setPhase('fill')
      setStepIndex(Math.max(0, steps.length - 1))
      return
    }
    if (clampedIndex > 0) setStepIndex(clampedIndex - 1)
  }

  function jumpTo(i: number) {
    if (i > activeIndex) return
    if (i === stepLabels.length - 1) {
      setPhase('review')
    } else {
      setPhase('fill')
      setStepIndex(i)
    }
  }

  // FormStep.key is `string`; the walker can only emit keys defined in the
  // form, so the cast to `keyof typeof stepRenderers` is sound.
  const renderer = currentStep
    ? stepRenderers[currentStep.key as keyof typeof stepRenderers]
    : undefined

  return (
    <section className="form">
      <ol className="stepper">
        {stepLabels.map((label, i) => (
          <li key={i}>
            <button
              type="button"
              className={
                activeIndex === i ? 'active' : activeIndex > i ? 'done' : undefined
              }
              disabled={i > activeIndex}
              title={humanize(label)}
              onClick={() => jumpTo(i)}
            >
              <span className="step-num">{i + 1}</span>
              <span className="step-label">{humanize(label)}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="content">
        {phase === 'fill' ? (
          <form
            className="step"
            onSubmit={(e) => {
              e.preventDefault()
              void goNext()
            }}
          >
            {currentStep && renderer ? renderer(form) : null}
            <div className="actions">
              {clampedIndex > 0 && (
                <button type="button" onClick={goBack}>
                  Back
                </button>
              )}
              <button type="submit">
                {clampedIndex === steps.length - 1 ? 'Review' : 'Next'}
              </button>
            </div>
          </form>
        ) : (
          <>
            <StepReview data={values} />
            <div className="actions">
              <button type="button" onClick={goBack}>
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  void form.handleSubmit()
                }}
              >
                Submit
              </button>
            </div>
          </>
        )}

        <pre className="debug">
          {JSON.stringify(
            { values, stepIndex: clampedIndex, steps: steps.map((s) => s.key) },
            null,
            2,
          )}
        </pre>
      </div>
    </section>
  )
}
