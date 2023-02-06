<template>
  <PaymentFrame :loading="!token" :step="step">
    <CardPayment
      v-if="token"
      :plan="plan"
      :token="token"
      @pay="submit($event)"
      @update:pending="pending = $event"
    />
  </PaymentFrame>
</template>

<script setup lang="ts">
const { token, step, plan, pending, submit } = useBraintree()
</script>
