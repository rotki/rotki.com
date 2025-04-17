<script setup lang="ts">
import { set } from '@vueuse/core';
import { usePaymentCardsStore } from '~/store/payments/cards';

const loadingCard = ref(false);

const {
  loading,
  nextPayment,
  pending,
  selectedPlan,
  step,
  submit,
  token,
} = useBraintree();
const store = usePaymentCardsStore();
const { getCard } = store;
const { card } = storeToRefs(store);

onBeforeMount(async () => {
  set(loadingCard, true);
  await getCard();
  set(loadingCard, false);
});
</script>

<template>
  <PaymentFrame :step="step">
    <template #default="slotProps">
      <CardPayment
        v-if="token && selectedPlan && !loading && !loadingCard"
        v-bind="slotProps"
        :card="card"
        :plan="selectedPlan"
        :token="token"
        :next-payment="nextPayment"
        @submit="submit($event)"
        @update:pending="pending = $event"
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
