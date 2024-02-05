<script lang="ts" setup>
import { get, set, useTimestamp } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import type { Ref } from 'vue';
import type { SelectedPlan } from '~/types';

const { t } = useI18n();

const store = useMainStore();
const { account, plans } = storeToRefs(store);
const acceptRefundPolicy = ref(false);
const processing: Ref<boolean> = ref(false);

const { plan } = usePlanParams();
const { currency } = useCurrencyParams();
const { paymentMethodId } = usePaymentMethodParam();
const { subscriptionId } = useSubscriptionIdParam();

const selectedPlan = computed<SelectedPlan>(() => {
  const availablePlans = get(plans);
  const months = get(plan);
  const selectedPlan = availablePlans?.find(plan => plan.months === months);
  const price = selectedPlan?.priceCrypto ?? '0';
  return {
    startDate: get(useTimestamp()) / 1000,
    finalPriceInEur: price,
    priceInEur: price,
    months,
    vat: get(account)?.vat ?? 0,
  };
});

async function back() {
  await navigateTo({
    name: 'checkout-pay-method',
    query: {
      plan: get(plan),
      method: get(paymentMethodId),
    },
  });
}

function submit() {
  set(processing, true);
  navigateTo({
    name: 'checkout-pay-crypto',
    query: {
      plan: get(plan),
      currency: get(currency),
      method: get(paymentMethodId),
      id: get(subscriptionId),
    },
  });
}

onMounted(async () => await store.getPlans());
const css = useCssModule();
</script>

<template>
  <div :class="css.content">
    <CheckoutTitle>{{ t('home.plans.tiers.step_3.title') }}</CheckoutTitle>
    <CheckoutDescription>
      {{ t('home.plans.tiers.step_3.subtitle') }}
    </CheckoutDescription>
    <CryptoPaymentInfo />
    <SelectedPlanOverview
      :plan="selectedPlan"
      :disabled="processing"
      crypto
    />
    <AcceptRefundPolicy
      v-model="acceptRefundPolicy"
      :class="css.policy"
      :disabled="processing"
    />
    <div :class="css.buttons">
      <RuiButton
        :disabled="processing"
        class="w-full"
        size="lg"
        @click="back()"
      >
        {{ t('actions.back') }}
      </RuiButton>
      <RuiButton
        :disabled="!acceptRefundPolicy"
        :loading="processing"
        class="w-full"
        color="primary"
        size="lg"
        @click="submit()"
      >
        {{ t('home.plans.tiers.step_3.start') }}
      </RuiButton>
    </div>
  </div>
</template>

<style lang="scss" module>
.content {
  @apply flex flex-col w-full max-w-[27.5rem] mx-auto grow;
}

.policy {
  @apply my-8;
}

.buttons {
  @apply flex gap-4 justify-center w-full mt-auto;
}
</style>
