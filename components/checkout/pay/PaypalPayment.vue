<template>
  <error-display v-if="error" :message="error" title="Initialization Error" />
  <div v-else id="paypal-button"></div>
</template>
<script lang="ts">
import {
  defineComponent,
  onMounted,
  onUnmounted,
  PropType,
  Ref,
  ref,
  toRefs,
} from '@nuxtjs/composition-api'
import braintree from 'braintree-web'
import { SelectedPlan } from '~/types'
import { assert } from '~/utils/assert'

async function initializeBraintree(
  token: Ref<string>,
  plan: Ref<SelectedPlan>,
  emit: (event: string, ...args: any[]) => void
) {
  const client = await braintree.client.create({
    authorization: token.value,
  })

  const paypalCheckout = await braintree.paypalCheckout.create({
    client,
  })

  await paypalCheckout.loadPayPalSDK()
  const paypal = window.paypal
  assert(paypal)
  paypal.Button.render(
    {
      env: paypal.Environment.Sandbox,
      payment() {
        return paypalCheckout.createPayment({
          flow: paypal.FlowType.Checkout,
          amount: plan.value.finalPriceInEur,
          currency: 'EUR',
        })
      },
      async onAuthorize(data) {
        const token = await paypalCheckout.tokenizePayment(data)
        emit('pay', {
          months: plan.value.months,
          nonce: token.nonce,
        })
        return token
      },
    },
    '#paypal-button'
  )
  return client
}

export default defineComponent({
  name: 'PaypalPayment',
  props: {
    token: { required: true, type: String },
    plan: { required: true, type: Object as PropType<SelectedPlan> },
  },
  emits: ['pay'],
  setup(props, { emit }) {
    const { token, plan } = toRefs(props)
    const error = ref('')
    let client: braintree.Client | null = null
    onMounted(async () => {
      try {
        client = await initializeBraintree(token, plan, emit)
      } catch (e: any) {
        error.value = e.message
      }
    })

    onUnmounted(async () => {
      await client?.teardown(() => {})
    })
    return {
      error,
    }
  },
})
</script>
