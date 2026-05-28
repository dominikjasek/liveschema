<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toStandardSchema } from '@liveschema/core'
import { useLiveSchema } from '@liveschema/vue'
import { form as orderForm, type Order, type FieldKey } from '@/schemas'

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

const orderStandardSchema = toStandardSchema(orderForm)

const { values, defineField, errors, handleSubmit } = useForm<Order>({
  validationSchema: orderStandardSchema,
  keepValuesOnUnmount: true,
  initialValues: {
    email: '',
    fullName: '',
    orderType: 'pickup',
    hasOrderedBefore: false,
    mainCourse: 'pizza',
    pizzaSize: 'small',
    toppings: '',
  },
})

const [email] = defineField('email')
const [fullName] = defineField('fullName')
const [orderType] = defineField('orderType')
const [leaveAtDoor] = defineField('leaveAtDoor')
const [hasOrderedBefore] = defineField('hasOrderedBefore')
const [favoriteItem] = defineField('favoriteItem')
const [mainCourse] = defineField('mainCourse')
const [pizzaSize] = defineField('pizzaSize')
const [toppings] = defineField('toppings')
const [pizzaCount] = defineField('pizzaCount')
const [requestedReadyTime] = defineField('requestedReadyTime')
const [dressingOnSide] = defineField('dressingOnSide')
const [needsNapkins] = defineField('needsNapkins')
const [napkinCount] = defineField('napkinCount')

const { fields: liveSchemaFields } = useLiveSchema(orderForm, values)

const onSubmit = handleSubmit((data) => {
  alert(`Submitted!\n\n${JSON.stringify(data, null, 2)}`)
})
</script>

<template>
  <header>
    <h1>Vue vee-validate form</h1>
  </header>
  <main>
    <section class="form-single">
      <form class="form-fields" @submit="onSubmit">
        <label v-if="liveSchemaFields.email.isActive" class="field">
          <span>{{ labels.email }}</span>
          <input v-model="email" class="text-input" type="text" />
          <p v-if="errors.email" class="error">{{ errors.email }}</p>
        </label>

        <label v-if="liveSchemaFields.fullName.isActive" class="field">
          <span>{{ labels.fullName }}</span>
          <input v-model="fullName" class="text-input" type="text" />
          <p v-if="errors.fullName" class="error">{{ errors.fullName }}</p>
        </label>

        <div v-if="liveSchemaFields.orderType.isActive" class="field">
          <span>{{ labels.orderType }}</span>
          <div class="options">
            <label v-for="o in liveSchemaFields.orderType.enumOptions ?? []" :key="o" class="radio">
              <input v-model="orderType" type="radio" :value="o" />
              <span>{{ o }}</span>
            </label>
          </div>
          <p v-if="errors.orderType" class="error">{{ errors.orderType }}</p>
        </div>

        <div v-if="liveSchemaFields.leaveAtDoor.isActive" class="field">
          <label class="confirm">
            <input v-model="leaveAtDoor" type="checkbox" />
            <span>{{ labels.leaveAtDoor }}</span>
          </label>
          <p v-if="errors.leaveAtDoor" class="error">{{ errors.leaveAtDoor }}</p>
        </div>

        <div v-if="liveSchemaFields.hasOrderedBefore.isActive" class="field">
          <label class="confirm">
            <input v-model="hasOrderedBefore" type="checkbox" />
            <span>{{ labels.hasOrderedBefore }}</span>
          </label>
          <p v-if="errors.hasOrderedBefore" class="error">{{ errors.hasOrderedBefore }}</p>
        </div>

        <label v-if="liveSchemaFields.favoriteItem.isActive" class="field">
          <span>{{ labels.favoriteItem }}</span>
          <input v-model="favoriteItem" class="text-input" type="text" />
          <p v-if="errors.favoriteItem" class="error">{{ errors.favoriteItem }}</p>
        </label>

        <div v-if="liveSchemaFields.mainCourse.isActive" class="field">
          <span>{{ labels.mainCourse }}</span>
          <div class="options">
            <label v-for="o in liveSchemaFields.mainCourse.enumOptions ?? []" :key="o" class="radio">
              <input v-model="mainCourse" type="radio" :value="o" />
              <span>{{ o }}</span>
            </label>
          </div>
          <p v-if="errors.mainCourse" class="error">{{ errors.mainCourse }}</p>
        </div>

        <div v-if="liveSchemaFields.pizzaSize.isActive" class="field">
          <span>{{ labels.pizzaSize }}</span>
          <div class="options">
            <label v-for="o in liveSchemaFields.pizzaSize.enumOptions ?? []" :key="o" class="radio">
              <input v-model="pizzaSize" type="radio" :value="o" />
              <span>{{ o }}</span>
            </label>
          </div>
          <p v-if="errors.pizzaSize" class="error">{{ errors.pizzaSize }}</p>
        </div>

        <label v-if="liveSchemaFields.toppings.isActive" class="field">
          <span>{{ labels.toppings }}</span>
          <input v-model="toppings" class="text-input" type="text" />
          <p v-if="errors.toppings" class="error">{{ errors.toppings }}</p>
        </label>

        <label v-if="liveSchemaFields.pizzaCount.isActive" class="field">
          <span>{{ labels.pizzaCount }}</span>
          <input v-model="pizzaCount" class="text-input" type="text" />
          <p v-if="errors.pizzaCount" class="error">{{ errors.pizzaCount }}</p>
        </label>

        <label v-if="liveSchemaFields.requestedReadyTime.isActive" class="field">
          <span>{{ labels.requestedReadyTime }}</span>
          <input v-model="requestedReadyTime" class="text-input" type="text" />
          <p v-if="errors.requestedReadyTime" class="error">{{ errors.requestedReadyTime }}</p>
        </label>

        <div v-if="liveSchemaFields.dressingOnSide.isActive" class="field">
          <label class="confirm">
            <input v-model="dressingOnSide" type="checkbox" />
            <span>{{ labels.dressingOnSide }}</span>
          </label>
          <p v-if="errors.dressingOnSide" class="error">{{ errors.dressingOnSide }}</p>
        </div>

        <div v-if="liveSchemaFields.needsNapkins.isActive" class="field">
          <label class="confirm">
            <input v-model="needsNapkins" type="checkbox" />
            <span>{{ labels.needsNapkins }}</span>
          </label>
          <p v-if="errors.needsNapkins" class="error">{{ errors.needsNapkins }}</p>
        </div>

        <label v-if="liveSchemaFields.napkinCount.isActive" class="field">
          <span>{{ labels.napkinCount }}</span>
          <input v-model="napkinCount" class="text-input" type="text" />
          <p v-if="errors.napkinCount" class="error">{{ errors.napkinCount }}</p>
        </label>

        <div class="actions">
          <button type="submit">Submit</button>
        </div>
      </form>
      <pre class="debug">{{ JSON.stringify(values, null, 2) }}</pre>
    </section>
  </main>
</template>

<style scoped>
header {
  text-align: center;
  margin-top: 2rem;
}

.form-single {
  max-width: 640px;
  margin: 2rem auto;
  font-family: system-ui, sans-serif;
  text-align: left;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.field > span {
  font-size: 0.9rem;
  color: var(--text);
}

.text-input {
  padding: 0.5rem 0.6rem;
  font-size: 1rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
  width: 18rem;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.radio {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  text-transform: capitalize;
}

.radio:has(input:checked) {
  border-color: var(--accent);
  background: var(--accent-bg);
}

.confirm {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1rem;
}

.actions button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--accent);
  border-radius: 6px;
  background: var(--accent);
  color: white;
  cursor: pointer;
  font: inherit;
}

.error {
  color: #ef4444;
  font-size: 0.85rem;
  margin: 0.25rem 0 0;
}

.debug {
  background: var(--code-bg);
  color: var(--text-h);
  padding: 0.5rem;
  margin: 1rem 0;
  font-size: 0.7rem;
  border-radius: 4px;
  white-space: pre-wrap;
  overflow-x: auto;
}
</style>
