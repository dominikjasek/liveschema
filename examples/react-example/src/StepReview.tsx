import { activeFields } from '@liveschema/core'
import { form } from './schemas'
import { humanize } from './stepLabels'

function display(value: unknown): string {
  if (value === undefined || value === null) return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => `${k}: ${display(v)}`)
      .join(' · ')
  }
  return String(value)
}

export function StepReview({ data }: { data: Record<string, unknown> }) {
  const items = activeFields(form, data).map((step) => ({
    key: step.key,
    value: step.value,
  }))
  return (
    <>
      <h2>Review</h2>
      <dl className="review">
        {items.map((item) => (
          <div key={item.key} className="review-row">
            <dt>{humanize(item.key)}</dt>
            <dd>{display(item.value)}</dd>
          </div>
        ))}
      </dl>
    </>
  )
}
