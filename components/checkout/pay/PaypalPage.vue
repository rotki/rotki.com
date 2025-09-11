<script setup lang="ts">
const { token, step, plan, pending, loading, submit, reset } = useBraintree();
</script>

<template>
  <PaymentFrame
    v-model:step="step"
    :loading="!(token && plan) || !loading"
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
