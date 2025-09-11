<script setup lang="ts">
import { useBraintreeScript } from '~/composables/use-braintree-script';

// Initialize Braintree script loading
const { ready: braintreeReady } = useBraintreeScript('paypal');

const { token, step, plan, pending, loading, submit, reset } = useBraintree();
</script>

<template>
  <PaymentFrame
    v-model:step="step"
    :loading="!(token && plan) || !braintreeReady"
  >
    <template #default="{ status }">
      <PaypalPayment
        v-if="plan"
        :status="status"
        :loading="loading"
        :plan="plan"
        :token="token"
        @pay="submit($event)"
        @update:pending="pending = $event"
        @clear:errors="reset()"
      />
    </template>
  </PaymentFrame>
</template>
