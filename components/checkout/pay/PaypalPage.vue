<template>
  <PaymentFrame :loading="!token" :step="step">
    <PaypalPayment
      v-if="token"
      :plan="plan"
      :token="token"
      @pay="submit($event)"
    />
  </PaymentFrame>
</template>

<script setup lang="ts">
const { token, step, plan, submit } = useBraintree()
</script>
