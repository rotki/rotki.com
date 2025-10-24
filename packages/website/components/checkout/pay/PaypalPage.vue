<script setup lang="ts">
const { token, step, selectedPlan, btClient } = useBraintree();
</script>

<template>
  <PaymentFrame
    v-model:step="step"
    :loading="!(token && selectedPlan)"
    wide
  >
    <template #default="{ status }">
      <PaypalPayment
        v-if="selectedPlan && btClient"
        :status="status"
      />
    </template>
  </PaymentFrame>
</template>
