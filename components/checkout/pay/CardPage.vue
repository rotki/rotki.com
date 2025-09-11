<script setup lang="ts">
import type { SavedCard } from '~/types';
import { get, set } from '@vueuse/core';
import { usePaymentCards } from '~/composables/use-payment-cards';

const isInitialLoad = ref<boolean>(true);

const { token, step, plan, pending, loading, submit } = useBraintree();
const { getCard } = usePaymentCards();

const { data: card, pending: loadingCard, refresh: refreshCard } = await useAsyncData(
  'saved-card',
  async () => await getCard(),
  {
    default: (): SavedCard | undefined => undefined,
  },
);

watch(loadingCard, (isLoading) => {
  if (!isLoading && get(isInitialLoad)) {
    set(isInitialLoad, false);
  }
});
</script>

<template>
  <PaymentFrame :step="step">
    <template #default="slotProps">
      <div
        v-if="!(token && plan) || loading || (loadingCard && isInitialLoad)"
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
        @card-deleted="refreshCard()"
        @card-added="refreshCard()"
      />
    </template>
  </PaymentFrame>
</template>
