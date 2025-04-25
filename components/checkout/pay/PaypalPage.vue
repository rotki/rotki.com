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
} = useBraintree();
</script>

<template>
  <PaymentFrame :step="step">
    <template #default="slotProps">
      <div
        v-if="!(token && selectedPlan)"
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
        :plan="selectedPlan"
        :token="token"
        :next-payment="nextPayment"
        @submit="submit($event)"
        @update:pending="pending = $event"
        @clear:errors="reset()"
      />
    </template>
  </PaymentFrame>
</template>
