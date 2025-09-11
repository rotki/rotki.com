<script setup lang="ts">
import { useBraintreeScript } from '~/composables/use-braintree-script';

// Initialize Braintree script loading
const { ready: braintreeReady } = useBraintreeScript('paypal');

const { token, step, plan, pending, loading, submit, reset } = useBraintree();
</script>

<template>
  <PaymentFrame :step="step">
    <template #default="slotProps">
      <div
        v-if="!(token && plan) || !braintreeReady"
        class="flex justify-center my-10"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>
      <PaypalPayment
        v-else
        v-bind="slotProps"
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
