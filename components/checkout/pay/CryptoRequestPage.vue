<script setup lang="ts">
import { get, useTimestamp } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { type SelectedPlan } from '~/types';
import { useMainStore } from '~/store';

const store = useMainStore();
const { account, plans } = storeToRefs(store);
const acceptRefundPolicy = ref(false);

const { plan } = usePlanParams();
const { currency } = useCurrencyParams();
const { subscriptionId } = useSubscriptionIdParam();
const selectedPlan = computed<SelectedPlan>(() => {
  const availablePlans = get(plans);
  const months = get(plan);
  const selectedPlan = availablePlans?.find((plan) => plan.months === months);
  return {
    startDate: get(useTimestamp()) / 1000,
    finalPriceInEur: selectedPlan?.priceCrypto ?? '0',
    priceInEur: selectedPlan?.priceCrypto ?? '0',
    months,
    vat: get(account)?.vat || 0,
  };
});

const submit = () => {
  navigateTo({
    path: '/checkout/pay/crypto',
    query: {
      p: get(plan).toString(),
      c: get(currency),
      id: get(subscriptionId),
    },
  });
};

onMounted(async () => await store.getPlans());
const css = useCssModule();
</script>

<template>
  <PageContainer :center-vertically="false">
    <template #title>Crypto Payment</template>
    <PageContent>
      <div :class="css.content">
        <CheckoutTitle>Payment Details</CheckoutTitle>
        <div>Payments by crypto can have slower processing times.</div>
        <CryptoPaymentInfo />
        <SelectedPlanOverview :plan="selectedPlan" crypto />
        <AcceptRefundPolicy v-model="acceptRefundPolicy" :class="css.policy" />
        <SelectionButton
          :class="css.button"
          :disabled="!acceptRefundPolicy"
          selected
          @click="submit"
        >
          Submit Request
        </SelectionButton>
      </div>
    </PageContent>
  </PageContainer>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';

.content {
  padding: 0;
}

.description {
  max-width: 600px;

  @include text-size(18px, 21px);
}

.button {
  @apply mt-10;
}

.policy {
  @apply mt-8;
}
</style>
