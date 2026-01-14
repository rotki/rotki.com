<script lang="ts" setup>
import { get, isDefined, set } from '@vueuse/shared';
import AcceptRefundPolicy from '~/modules/checkout/components/common/AcceptRefundPolicy.vue';
import OrderSummaryCard from '~/modules/checkout/components/common/OrderSummaryCard.vue';
import PaymentLayout from '~/modules/checkout/components/common/PaymentLayout.vue';
import CryptoAssetSelector from '~/modules/checkout/components/crypto/CryptoAssetSelector.vue';
import CryptoPaymentInfo from '~/modules/checkout/components/crypto/CryptoPaymentInfo.vue';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';
import { buildQueryParams } from '~/utils/query';

const { t } = useI18n({ useScope: 'global' });

const isRefundPolicyAccepted = ref<boolean>(false);
const processing = ref<boolean>(false);
const selectedCurrency = ref<string>('');

const {
  planId,
  subscriptionId,
  upgradeSubId,
  referralCode,
  appliedDiscountCode,
  fetchBreakdown,
  breakdownLoading,
  selectedPlan,
  breakdown,
  isCrypto,
  discountCodeInput,
  applyDiscount,
  error,
  loading: checkoutLoading,
  clearError,
  ensureAvailablePlans,
  switchPlan,
  planSwitchLoading,
} = useCheckout();

const loading = computed<boolean>(() => get(planSwitchLoading) || get(breakdownLoading) || get(checkoutLoading));

onMounted(async () => {
  await Promise.all([ensureAvailablePlans(), fetchBreakdown()]);
});

const valid = computed<boolean>(() => get(isRefundPolicyAccepted) && !!get(selectedCurrency));

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
    currency: get(selectedCurrency),
    id: get(subscriptionId),
    discountCode: get(appliedDiscountCode),
    upgradeSubId: get(upgradeSubId),
  });

  navigateTo({
    name: 'checkout-pay-crypto',
    query,
  });
}
</script>

<template>
  <PaymentLayout
    :error="error"
    :loading="loading"
    @clear-error="clearError()"
  >
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr] lg:gap-8 lg:items-start">
      <!-- Main Content (Left Column) -->
      <div class="flex flex-col gap-6 min-w-0">
        <CryptoPaymentInfo class="mb-2" />

        <RuiCard>
          <div class="text-lg font-medium mb-6">
            {{ t('home.plans.tiers.step_3.select_payment') }}
          </div>
          <CryptoAssetSelector v-model="selectedCurrency" />
        </RuiCard>

        <AcceptRefundPolicy
          v-model="isRefundPolicyAccepted"
          :disabled="processing || loading"
        />
      </div>

      <!-- Sidebar (Right Column) -->
      <aside class="w-full lg:sticky lg:top-8 lg:self-start lg:max-w-sm">
        <OrderSummaryCard
          v-model:discount-code="discountCodeInput"
          :selected-plan="selectedPlan"
          :breakdown="breakdown"
          :upgrade-sub-id="upgradeSubId"
          :is-crypto="isCrypto"
          :loading="loading"
          :disabled="planSwitchLoading"
          @plan-change="switchPlan($event)"
          @apply-discount="applyDiscount()"
        />
      </aside>
    </div>

    <!-- Action Buttons (Outside Grid) -->
    <div class="flex gap-4 justify-center w-full mt-6 max-w-[27.5rem] mx-auto">
      <RuiButton
        v-if="!subscriptionId"
        :disabled="processing || loading"
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
        :disabled="!valid || loading"
        :loading="processing"
        class="w-full"
        color="primary"
        size="lg"
        @click="submit()"
      >
        {{ t('actions.continue') }}
      </RuiButton>
    </div>
  </PaymentLayout>
</template>
