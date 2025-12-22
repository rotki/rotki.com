<script lang="ts" setup>
import type { PaymentBreakdownResponse } from '@rotki/card-payment-common/schemas/plans';
import { get, isDefined, set } from '@vueuse/core';
import CheckoutDescription from '~/components/checkout/common/CheckoutDescription.vue';
import CheckoutTitle from '~/components/checkout/common/CheckoutTitle.vue';
import OrderSummaryCard from '~/components/checkout/common/OrderSummaryCard.vue';
import AcceptRefundPolicy from '~/components/checkout/pay/AcceptRefundPolicy.vue';
import CryptoPaymentInfo from '~/components/checkout/pay/crypto/payment/CryptoPaymentInfo.vue';
import CryptoAssetSelector from '~/components/checkout/pay/crypto/request/CryptoAssetSelector.vue';
import { useDiscountCodeParams, usePlanIdParam, useReferralCodeParam, useSubscriptionIdParam } from '~/composables/checkout/use-plan-params';
import { useSelectedPlan } from '~/composables/checkout/use-selected-plan';
import { useTiersApi } from '~/composables/tiers/use-tiers-api';
import { navigateToWithCSPSupport } from '~/utils/navigation';
import { buildQueryParams } from '~/utils/query';
import { logger } from '~/utils/use-logger';

const { t } = useI18n({ useScope: 'global' });

const isRefundPolicyAccepted = ref<boolean>(false);
const processing = ref<boolean>(false);

const currency = ref<string>('');
const paymentBreakdown = ref<PaymentBreakdownResponse | null>(null);

const { planId } = usePlanIdParam();
const { subscriptionId, upgradeSubId } = useSubscriptionIdParam();
const { referralCode } = useReferralCodeParam();
const { discountCode: routeDiscountCode } = useDiscountCodeParams();
const { selectedPlan } = useSelectedPlan();
const { fetchPaymentBreakdown } = useTiersApi();

const discountCode = ref<string>(get(routeDiscountCode) ?? '');

const valid = computed<boolean>(() => get(isRefundPolicyAccepted) && !!get(currency));

async function back(): Promise<void> {
  if (isDefined(upgradeSubId)) {
    await navigateTo({ name: 'home-subscription' });
    return;
  }

  const query = buildQueryParams({
    planId: get(planId),
    id: get(subscriptionId),
    ref: get(referralCode),
  });

  await navigateTo({
    name: 'checkout-pay-method',
    query,
  });
}

function submit(): void {
  set(processing, true);

  const query = buildQueryParams({
    planId: get(planId),
    currency: get(currency),
    id: get(subscriptionId),
    discountCode: get(discountCode),
    upgradeSubId: get(upgradeSubId),
  });

  navigateToWithCSPSupport({
    name: 'checkout-pay-crypto',
    query,
  });
}

async function loadPaymentBreakdown(): Promise<void> {
  if (!isDefined(upgradeSubId) || !isDefined(planId)) {
    return;
  }

  try {
    const breakdown = await fetchPaymentBreakdown({
      newPlanId: get(planId),
      isCryptoPayment: true,
    });
    set(paymentBreakdown, breakdown ?? null);
  }
  catch (error) {
    logger.error('Failed to fetch payment breakdown:', error);
  }
}

// Prefill discount code from referral code query param
watchImmediate(referralCode, (ref) => {
  if (ref && !get(discountCode)) {
    set(discountCode, ref);
  }
});

onMounted(async () => {
  loadPaymentBreakdown().catch();
});
</script>

<template>
  <div class="w-full max-w-7xl mx-auto">
    <div class="mb-8">
      <CheckoutTitle>
        {{ t('home.plans.tiers.step_3.title') }}
      </CheckoutTitle>
      <CheckoutDescription>
        {{ t('home.plans.tiers.step_3.subtitle') }}
      </CheckoutDescription>
    </div>

    <div class="flex flex-col gap-8 md:gap-10 xl:grid xl:grid-cols-[1.5fr_1fr] xl:gap-12 xl:items-start">
      <div class="flex flex-col gap-6 min-w-0">
        <CryptoPaymentInfo class="mb-2" />

        <RuiCard>
          <div class="text-lg font-medium mb-6">
            {{ t('home.plans.tiers.step_3.select_payment') }}
          </div>
          <CryptoAssetSelector v-model="currency" />
        </RuiCard>
      </div>

      <aside
        v-if="selectedPlan"
        class="w-full xl:sticky xl:top-8 xl:self-start"
      >
        <OrderSummaryCard
          v-model:discount-code="discountCode"
          :plan="selectedPlan"
          :checkout-data="paymentBreakdown"
          :upgrade-sub-id="upgradeSubId"
          crypto
        />
      </aside>
    </div>

    <AcceptRefundPolicy
      v-model="isRefundPolicyAccepted"
      class="mt-6 max-w-[27.5rem] mx-auto w-full"
      :disabled="processing"
    />

    <div class="flex gap-4 justify-center w-full mt-6 mx-auto max-w-[27.5rem]">
      <RuiButton
        v-if="!subscriptionId"
        :disabled="processing"
        class="w-full"
        size="lg"
        @click="back()"
      >
        <template #prepend>
          <RuiIcon
            name="lu-arrow-left"
            size="16"
          />
        </template>
        {{ t('actions.back') }}
      </RuiButton>
      <RuiButton
        :disabled="!valid"
        :loading="processing"
        class="w-full"
        color="primary"
        size="lg"
        @click="submit()"
      >
        {{ t('actions.continue') }}
      </RuiButton>
    </div>
  </div>
</template>
