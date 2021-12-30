<template>
  <payment-frame :loading="false">
    <paypal-payment v-if="token" :plan="plan" :token="token" />
  </payment-frame>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import { setupBraintree } from '~/composables/braintree'
import PaypalPayment from '~/components/checkout/pay/PaypalPayment.vue'

export default defineComponent({
  name: 'PaypalPage',
  components: { PaypalPayment },
  middleware: ['subscription', 'authentication'],
  setup() {
    return setupBraintree()
  },
})
</script>
