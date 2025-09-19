<script setup lang="ts">
const {
  loading,
  nextPayment,
  pending,
  reset,
  selectedPlan,
  step,
  submit,
  token,
  checkoutData,
} = useBraintree();
</script>

<template>
  <PaymentFrame :step="step">
    <template #default="slotProps">
      <PaypalPayment
        v-if="checkoutData && token && selectedPlan && !loading"
        v-bind="slotProps"
        :loading="loading"
        :plan="selectedPlan"
        :token="token"
        :checkout-data="checkoutData"
        :next-payment="nextPayment"
        @submit="submit($event)"
        @update:pending="pending = $event"
        @clear:errors="reset()"
      />
      <div
        v-else
        class="flex justify-center my-10"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>
    </template>
  </PaymentFrame>
</template>
