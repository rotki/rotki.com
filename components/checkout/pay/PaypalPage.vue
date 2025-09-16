<script setup lang="ts">
const { token, step, plan, btClient } = useBraintree();
</script>

<template>
  <PaymentFrame
    v-model:step="step"
    :loading="!(token && plan)"
  >
    <template #default="{ status }">
      <PaypalPayment
        v-if="plan && btClient"
        :status="status"
      />
    </template>
  </PaymentFrame>
</template>
