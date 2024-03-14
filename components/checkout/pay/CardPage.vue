<script setup lang="ts">
import { set } from '@vueuse/core';
import { usePaymentCardsStore } from '~/store/payments/cards';

const { token, step, plan, pending, loading, submit } = useBraintree();

const store = usePaymentCardsStore();
const { getCard } = store;
const { card } = storeToRefs(store);
const loadingCard = ref(false);

onBeforeMount(async () => {
  set(loadingCard, true);
  await getCard();
  set(loadingCard, false);
});
</script>

<template>
  <PaymentFrame :step="step">
    <template #default="slotProps">
      <div
        v-if="!(token && plan) || loading || loadingCard"
        class="flex justify-center my-10"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>
      <CardPayment
        v-else
        :card="card"
        v-bind="slotProps"
        :plan="plan"
        :token="token"
        @pay="submit($event)"
        @update:pending="pending = $event"
      />
    </template>
  </PaymentFrame>
</template>
