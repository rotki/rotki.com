<template>
  <payment-frame :loading="!token">
    <pending-display
      v-if="pending && !paymentSuccess"
      title="Payment in progress"
      message="Please wait while your payment is processed"
    />
    <error-display
      v-else-if="paymentError"
      :message="paymentError"
      title="Payment Failed"
    />
    <success-display
      v-else-if="paymentSuccess"
      message="Your payment was successful, you can manage you account by going to"
      title="Payment success"
    >
      <div :class="$style['action-wrapper']">
        <nuxt-link :class="$style.action" to="/home">
          Account Management
        </nuxt-link>
      </div>
    </success-display>
    <card-payment
      v-else-if="token"
      :plan="plan"
      :token="token"
      @pay="submit($event)"
      @update:pending="pending = $event"
    />
  </payment-frame>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'
import { setupBraintree } from '~/composables/braintree'

export default defineComponent({
  name: 'CardPage',
  setup() {
    return setupBraintree()
  },
})
</script>

<style lang="scss" module>
.card {
  @apply absolute top-3.5 right-2;

  width: 24px;
  height: 24px;
}

.action-wrapper {
  @apply flex flex-row justify-center;
}

.action {
  @apply text-primary3 text-center mt-3 mb-1;
}
</style>
