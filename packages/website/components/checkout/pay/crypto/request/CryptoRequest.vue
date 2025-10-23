<script lang="ts" setup>
import type { DiscountInfo } from '@rotki/card-payment-common/schemas/discount';
import { getDiscountedPrice } from '@rotki/card-payment-common/utils/checkout';
import { get, set } from '@vueuse/core';
import PaymentGrandTotal from '~/components/checkout/pay/PaymentGrandTotal.vue';

const { t } = useI18n({ useScope: 'global' });

const acceptRefundPolicy = ref<boolean>(false);
const processing = ref<boolean>(false);

const currency = ref('');

const discountCode = ref('');
const discountInfo = ref<DiscountInfo>();

const { planId } = usePlanIdParam();
const { subscriptionId, upgradeSubId } = useSubscriptionIdParam();

const { selectedPlan } = useSelectedPlan();

async function back() {
  if (isDefined(upgradeSubId)) {
    navigateTo({
      name: 'home-subscription',
    });
    return;
  }

  const currentPlanId = get(planId);
  const query: Record<string, string> = {};

  if (currentPlanId) {
    query.planId = String(currentPlanId);
  }

  const id = get(subscriptionId);
  if (id) {
    query.id = id;
  }

  await navigateTo({
    name: 'checkout-pay-method',
    query,
  });
}

function submit() {
  set(processing, true);
  const currentPlanId = get(planId);
  const query: Record<string, string> = {};

  if (currentPlanId) {
    query.planId = String(currentPlanId);
  }

  const selectedCurrency = get(currency);
  if (selectedCurrency) {
    query.currency = selectedCurrency;
  }

  const id = get(subscriptionId);
  if (id) {
    query.id = id;
  }

  const discount = get(discountCode);
  if (discount) {
    query.discountCode = discount;
  }

  const upgradeId = get(upgradeSubId);
  if (upgradeId) {
    query.upgradeSubId = upgradeId;
  }

  navigateToWithCSPSupport({
    name: 'checkout-pay-crypto',
    query,
  });
}

const valid = computed<boolean>(() => get(acceptRefundPolicy) && !!get(currency));

const grandTotal = computed<number>(() => {
  const plan = get(selectedPlan);

  if (!plan)
    return 0;

  return getDiscountedPrice(plan, get(discountInfo));
});
</script>

<template>
  <div class="w-full max-w-7xl mx-auto md:p-6">
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
        <RuiCard>
          <div class="text-lg font-medium mb-6">
            {{ t('home.plans.tiers.step_3.order_summary') }}
          </div>

          <SelectedPlanOverview
            :upgrade="!!upgradeSubId"
            :plan="selectedPlan"
            crypto
          />

          <RuiDivider class="my-6" />

          <DiscountCodeInput
            v-if="!upgradeSubId"
            v-model="discountCode"
            v-model:discount-info="discountInfo"
            :plan="selectedPlan"
            class="mb-6"
          />

          <PaymentGrandTotal
            :upgrade="!!upgradeSubId"
            :grand-total="grandTotal"
          />
        </RuiCard>
      </aside>
    </div>

    <AcceptRefundPolicy
      v-model="acceptRefundPolicy"
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
