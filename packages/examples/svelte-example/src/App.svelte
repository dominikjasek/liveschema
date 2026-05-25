<script lang="ts">
  import { createForm } from 'felte'
  import { activeFields, enumOptions, toStandardSchema } from '@liveschema/core'
  import { form as formDef, type FieldKey, type FormValues } from './schema'

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

  // liveschema's Standard Schema validator over the *currently reachable*
  // fields. We feed Felte's `validate` so per-field errors come straight
  // from each Effect schema, routed by the issue's `path[0]`.
  const standardSchema = toStandardSchema<FormValues, FormValues>(formDef)

  const { form, data, errors } = createForm<Record<string, unknown>>({
    initialValues: {
      email: '',
      fullName: '',
      orderType: 'pickup',
      hasOrderedBefore: false,
      mainCourse: 'pizza',
      toppings: '',
    },
    validate: (values) => {
      const result = standardSchema['~standard'].validate(values)
      if (result instanceof Promise) return undefined
      if (!result.issues) return undefined
      const errs: Record<string, string> = {}
      for (const issue of result.issues) {
        const key = String(issue.path?.[0] ?? '')
        if (key && !errs[key]) errs[key] = issue.message
      }
      return errs
    },
    onSubmit: (values) => {
      alert(`Submitted!\n\n${JSON.stringify(values, null, 2)}`)
    },
  })

  console.log("errors", errors)

  $: fields = activeFields(formDef, $data)

  function fieldError(key: string): string | undefined {
    const e = ($errors as Record<string, unknown>)[key]
    return typeof e === 'string' ? e : undefined
  }
</script>

<header>
  <h1>Svelte + Effect Schema</h1>
</header>
<main>
  <section class="form-single">
    <form class="form-fields" use:form>
      {#each fields as field (field.key)}
        {@const key = field.key}
        {@const label = labels[key as FieldKey]}
        {@const options = enumOptions(field.schema)}
        {#if options}
          <div class="field">
            <span>{label}</span>
            <div class="options">
              {#each options as o (o)}
                <label class="radio">
                  <input type="radio" name={key} value={o} />
                  <span>{o}</span>
                </label>
              {/each}
            </div>
            {#if fieldError(key)}<p class="error">{fieldError(key)}</p>{/if}
          </div>
        {:else if checkboxKeys.has(key as FieldKey)}
          <div class="field">
            <label class="confirm">
              <input type="checkbox" name={key} />
              <span>{label}</span>
            </label>
            {#if fieldError(key)}<p class="error">{fieldError(key)}</p>{/if}
          </div>
        {:else}
          <label class="field">
            <span>{label}</span>
            <input class="text-input" type="text" name={key} />
            {#if fieldError(key)}<p class="error">{fieldError(key)}</p>{/if}
          </label>
        {/if}
      {/each}
      <div class="actions">
        <button type="submit">Submit</button>
      </div>
    </form>
    <pre class="debug">{JSON.stringify($data, null, 2)}</pre>
  </section>
</main>
