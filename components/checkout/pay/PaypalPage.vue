<template>
  <payment-frame :loading="!token" :step="step">
    <paypal-payment
      v-if="token"
      :plan="plan"
      :token="token"
      @pay="submit($event)"
    />
  </payment-frame>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import { useBraintree } from '~/composables/braintree'
import PaypalPayment from '~/components/checkout/pay/PaypalPayment.vue'

export default defineComponent({
  name: 'PaypalPage',
  components: { PaypalPayment },
  setup() {
    return useBraintree()
  },
})
</script>
