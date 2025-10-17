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
  <div :class="$style.content">
    <CheckoutTitle>
      {{ t('home.plans.tiers.step_3.title') }}
    </CheckoutTitle>
    <CheckoutDescription>
      {{ t('home.plans.tiers.step_3.subtitle') }}
    </CheckoutDescription>
    <CryptoPaymentInfo />
    <template v-if="selectedPlan">
      <RuiDivider class="mt-8 mb-4" />
      <SelectedPlanOverview
        :upgrade="!!upgradeSubId"
        :plan="selectedPlan"
        :next-payment="0"
      />

      <DiscountCodeInput
        v-if="!upgradeSubId"
        v-model="discountCode"
        v-model:discount-info="discountInfo"
        :plan="selectedPlan"
        class="mt-6"
      />

      <PaymentGrandTotal
        :upgrade="!!upgradeSubId"
        :grand-total="grandTotal"
        class="mt-6"
      />
    </template>
    <CryptoAssetSelector v-model="currency" />
    <AcceptRefundPolicy
      v-model="acceptRefundPolicy"
      :class="$style.policy"
      :disabled="processing"
    />
    <div :class="$style.buttons">
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
