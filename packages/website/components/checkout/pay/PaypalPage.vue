<script setup lang="ts">
import PaymentFrame from '~/components/checkout/common/PaymentFrame.vue';
import PaypalPayment from '~/components/checkout/pay/PaypalPayment.vue';
import { useBraintree } from '~/composables/checkout/use-braintree';

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
