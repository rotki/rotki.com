<template>
  <error-display v-if="error" :message="error" title="Initialization Error" />
  <div v-else>
    <div id="paypal-button" />
    <selected-plan-overview :plan="plan" />
    <accept-refund-policy v-model="accepted" />
    <error-notification :visible="mustAcceptRefund">
      <template #title> Refund policy </template>
      <template #description>
        You need to accept the refund policy before proceeding
      </template>
    </error-notification>
  </div>
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
  unref,
  watch,
} from '@nuxtjs/composition-api'
import braintree from 'braintree-web'
import { SelectedPlan } from '~/types'
import { assert } from '~/utils/assert'
import { logger } from '~/utils/logger'

async function initializeBraintree(
  token: Ref<string>,
  plan: Ref<SelectedPlan>,
  accepted: Ref<boolean>,
  mustAcceptRefund: Ref<boolean>,
  emit: (event: string, ...args: any[]) => void
) {
  let paypalActions: any = null
  watch(accepted, (accepted) => {
    if (accepted) {
      paypalActions?.enable()
      mustAcceptRefund.value = false
    } else {
      paypalActions?.disable()
    }
  })
  const client = await braintree.client.create({
    authorization: token.value,
  })

  const paypalCheckout = await braintree.paypalCheckout.create({
    client,
  })

  await paypalCheckout.loadPayPalSDK({
    currency: 'EUR',
    vault: true,
    commit: true,
    intent: 'tokenize',
  })

  const paypal = window.paypal
  assert(paypal)

  paypal
    .Buttons({
      createBillingAgreement: () => {
        logger.debug(`Creating payment for ${plan.value.finalPriceInEur} EUR`)
        return paypalCheckout.createPayment({
          flow: 'vault' as any,
          amount: plan.value.finalPriceInEur,
          currency: 'EUR',
        })
      },
      onApprove: async (data) => {
        logger.debug(`User approved PayPal payment`)
        const token = await paypalCheckout.tokenizePayment(data)
        emit('pay', {
          months: plan.value.months,
          nonce: token.nonce,
        })
        return token
      },
      onError: (error) => {
        logger.error('PayPal payment failed with error', error)
      },
      onCancel: () => {
        logger.info('PayPal payment was cancelled by user')
      },
      // @ts-expect-error
      onInit: (_, actions) => {
        paypalActions = actions
        const userAcceptedPolicy = unref(accepted)
        if (!userAcceptedPolicy) {
          actions.disable()
        }
      },
      onClick: () => {
        if (!unref(accepted)) {
          mustAcceptRefund.value = true
        }
      },
    })
    .render('#paypal-button')

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
    const accepted = ref(false)
    const mustAcceptRefund = ref(false)
    let client: braintree.Client | null = null
    onMounted(async () => {
      try {
        client = await initializeBraintree(
          token,
          plan,
          accepted,
          mustAcceptRefund,
          emit
        )
      } catch (e: any) {
        error.value = e.message
      }
    })

    onUnmounted(async () => {
      await client?.teardown(() => {})
    })
    return {
      error,
      accepted,
      mustAcceptRefund,
    }
  },
})
</script>

<style lang="scss" module>
.warning {
  @apply font-medium text-red-600;
}
</style>
