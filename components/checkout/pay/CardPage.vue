<template>
  <page wide>
    <div :class="$style.content">
      <checkout-title>Payment Details</checkout-title>

      <checkout-description>
        <div :class="$style.description">
          <span :class="$style.text">Payments are safely processed with</span>
          <braintree-icon :class="$style.braintree" />
        </div>
      </checkout-description>

      <div :class="$style.inputs">
        <hosted-field
          id="card-number"
          :class="$style.number"
          :empty="empty.number"
          :focused="focused === 'number'"
          :valid="!numberError"
          label="Card Number"
          number
          @click="focus('number')"
        />
        <hosted-field
          id="expiration"
          :class="$style.expiration"
          :empty="empty.expirationDate"
          :focused="focused === 'expirationDate'"
          :valid="!expirationError"
          label="Expiration"
          @click="focus('expirationDate')"
        />
        <hosted-field
          id="cvv"
          :class="$style.cvv"
          :empty="empty.cvv"
          :focused="focused === 'cvv'"
          :valid="!cvvError"
          label="CVV"
          @click="focus('cvv')"
        />
      </div>
      <selected-plan-overview :plan="plan" />
      <div>
        <selection-button
          :class="$style.button"
          :disabled="!valid"
          selected
          @click="submit"
        >
          Start subscription
        </selection-button>
      </div>
      <custom-checkbox id="refund" v-model="accepted">
        <span>
          I have read and agreed to the
          <nuxt-link :class="$style.link" target="_blank" to="/refund-policy">
            Refunds/Cancellation Policy
          </nuxt-link>
        </span>
      </custom-checkbox>
    </div>
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  Ref,
  ref,
  useAsync,
  useRoute,
  useStore,
} from '@nuxtjs/composition-api'
import braintree from 'braintree-web'
import { Actions } from '~/store'
import { CardCheckout, SelectedPlan } from '~/types'
import { assert } from '~/components/utils/assertions'

type FieldStatus = {
  valid: boolean
  touched: boolean
}

export default defineComponent({
  name: 'CardPage',
  setup() {
    const store = useStore()
    const route = useRoute()
    const checkout = useAsync<CardCheckout | Error>(() =>
      store.dispatch(Actions.CHECKOUT, route.value.query.p)
    )
    const plan = computed<SelectedPlan | null>(() => {
      if (!checkout.value || checkout.value instanceof Error) {
        return null
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { braintreeClientToken, ...data } = checkout.value
      return data
    })
    const accepted = ref(false)
    const defaultStatus: FieldStatus = {
      valid: false,
      touched: false,
    }
    const numberStatus = ref<FieldStatus>(defaultStatus)
    const expirationDateStatus = ref<FieldStatus>(defaultStatus)
    const cvvStatus = ref<FieldStatus>(defaultStatus)

    const numberError = computed(() => {
      const value = numberStatus.value
      return value.touched && !value.valid
    })

    const expirationError = computed(() => {
      const value = expirationDateStatus.value
      return value.touched && !value.valid
    })

    const cvvError = computed(() => {
      const value = cvvStatus.value
      return value.touched && !value.valid
    })

    const empty = ref({
      number: true,
      cvv: true,
      expirationDate: true,
    })

    const focused = ref('')
    const fields: Ref<braintree.HostedFields | null> = ref(null)
    onMounted(async () => {
      const data = checkout.value

      // TODO figure out loading mechanism
      assert(!(data instanceof Error) && data !== null)
      const authorization = data.braintreeClientToken
      const client = await braintree.client.create({
        authorization,
      })

      const hostedFields = await braintree.hostedFields.create({
        client,
        styles: {},
        fields: {
          number: {
            selector: '#card-number',
          },
          cvv: {
            selector: '#cvv',
          },
          expirationDate: {
            selector: '#expiration',
          },
        },
      })

      fields.value = hostedFields

      hostedFields.on('focus', (event) => {
        const field = event.emittedBy
        focused.value = field
        if (field === 'number') {
          numberStatus.value = { ...numberStatus.value, touched: true }
        } else if (field === 'expirationDate') {
          expirationDateStatus.value = {
            ...expirationDateStatus.value,
            touched: true,
          }
        } else if (field === 'cvv') {
          cvvStatus.value = { ...cvvStatus.value, touched: true }
        }
      })
      hostedFields.on('blur', (event) => {
        if (focused.value === event.emittedBy) {
          focused.value = ''
        }
      })

      hostedFields.on('notEmpty', (event) => {
        const field = event.fields[event.emittedBy]
        empty.value = { ...empty.value, [event.emittedBy]: field.isEmpty }
      })

      hostedFields.on('empty', (event) => {
        const field = event.fields[event.emittedBy]
        empty.value = { ...empty.value, [event.emittedBy]: field.isEmpty }
      })

      hostedFields.on('validityChange', (event) => {
        const field = event.emittedBy
        const valid = event.fields[field].isValid
        if (field === 'number') {
          numberStatus.value = { ...numberStatus.value, valid }
        } else if (field === 'expirationDate') {
          expirationDateStatus.value = { ...expirationDateStatus.value, valid }
        } else if (field === 'cvv') {
          cvvStatus.value = { ...cvvStatus.value, valid }
        }
      })
    })

    onUnmounted(() => {
      fields.value?.teardown()
    })

    const focus = (field: 'cvv' | 'expirationDate' | 'number') => {
      fields.value?.focus(field)
    }

    const valid = computed(
      () =>
        accepted.value &&
        numberStatus.value.valid &&
        expirationDateStatus.value.valid &&
        cvvStatus.value.valid
    )

    const submit = async () => {
      // TODO: send to server
      await fields.value?.tokenize()
    }
    return {
      plan,
      valid,
      empty,
      numberError,
      expirationError,
      cvvError,
      accepted,
      focused,
      focus,
      submit,
    }
  },
})
</script>

<style lang="scss" module>
.content {
  padding: 0;
}

.card {
  @apply absolute top-3.5 right-2;

  width: 24px;
  height: 24px;
}

.inputs {
  @apply flex flex-row;

  & > *:not(:first-child) {
    margin-left: 32px;
  }
}

.number {
  width: 328px;
}

.braintree {
  @apply ml-1;

  width: 120px;
}

.text {
  @apply pt-0.5;
}

.cvv,
.expiration {
  width: 128px;
}

.description {
  @apply flex flex-row;
}

.link {
  @apply text-primary3;
}

.button {
  margin-top: 51px;
}
</style>
