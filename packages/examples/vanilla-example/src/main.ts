import { z } from 'zod'
import { activeFields, reachableKeys, type FormField } from 'form-flow'
import { form } from './schema'

const formEl = document.getElementById('form') as HTMLFormElement
const valuesEl = document.getElementById('values') as HTMLPreElement

const values: Record<string, unknown> = {}

function optionsFor(s: FormField['schema']): string[] | null {
  if (s instanceof z.ZodEnum) return [...(s.options as readonly string[])]
  return null
}

function renderField(step: FormField): HTMLElement {
  const wrap = document.createElement('label')
  wrap.className = 'field'
  const title = document.createElement('span')
  title.textContent = step.key
  wrap.appendChild(title)

  const opts = optionsFor(step.schema)
  if (opts) {
    const select = document.createElement('select')
    select.dataset.path = step.key
    const blank = document.createElement('option')
    blank.value = ''
    blank.textContent = '—'
    select.appendChild(blank)
    for (const o of opts) {
      const opt = document.createElement('option')
      opt.value = o
      opt.textContent = o
      if (step.value === o) opt.selected = true
      select.appendChild(opt)
    }
    select.addEventListener('change', () => {
      values[step.key] = select.value || undefined
      render()
    })
    wrap.appendChild(select)
  } else if (step.schema instanceof z.ZodBoolean) {
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.dataset.path = step.key
    checkbox.checked = step.value === true
    checkbox.addEventListener('change', () => {
      values[step.key] = checkbox.checked
      render()
    })
    wrap.appendChild(checkbox)
  } else {
    const input = document.createElement('input')
    input.type = 'text'
    input.dataset.path = step.key
    input.value = typeof step.value === 'string' ? step.value : ''
    input.addEventListener('input', () => {
      values[step.key] = input.value
      render()
    })
    wrap.appendChild(input)
  }

  return wrap
}

function renderValues(): void {
  valuesEl.textContent = JSON.stringify(values, null, 2)
}

function pruneOrphans(): void {
  const reachable = reachableKeys(form, values)
  for (const k of Object.keys(values)) {
    if (!reachable.has(k)) delete values[k]
  }
}

type FocusState = { path: string; start: number | null; end: number | null }

function captureFocus(): FocusState | null {
  const el = document.activeElement
  if (!(el instanceof HTMLInputElement || el instanceof HTMLSelectElement)) return null
  const path = el.dataset.path
  if (!path) return null
  if (el instanceof HTMLInputElement && el.type !== 'checkbox' && el.type !== 'radio') {
    return { path, start: el.selectionStart, end: el.selectionEnd }
  }
  return { path, start: null, end: null }
}

function restoreFocus(state: FocusState | null): void {
  if (!state) return
  const el = formEl.querySelector<HTMLInputElement | HTMLSelectElement>(
    `[data-path="${CSS.escape(state.path)}"]`,
  )
  if (!el) return
  el.focus()
  if (el instanceof HTMLInputElement && state.start !== null && state.end !== null) {
    try {
      el.setSelectionRange(state.start, state.end)
    } catch {
      // some input types disallow setSelectionRange — ignore
    }
  }
}

function render(): void {
  const focusState = captureFocus()
  pruneOrphans()
  const steps = activeFields(form, values)
  formEl.replaceChildren(...steps.map(renderField))
  renderValues()
  restoreFocus(focusState)
}

render()
