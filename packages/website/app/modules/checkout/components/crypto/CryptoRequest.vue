<script lang="ts" setup>
import CheckoutAlert from '@rotki/checkout-ui/components/CheckoutAlert.vue';
import PaymentPage from '@rotki/checkout-ui/components/PaymentPage.vue';
import PolicyConsent from '@rotki/checkout-ui/components/PolicyConsent.vue';
import { useOrderTotals } from '@rotki/checkout-ui/composables/order-totals';
import { get, set } from '@vueuse/shared';
import CheckoutLoadingOverlay from '~/modules/checkout/components/common/CheckoutLoadingOverlay.vue';
import OrderSummaryCard from '~/modules/checkout/components/common/OrderSummaryCard.vue';
import CryptoAssetSelector from '~/modules/checkout/components/crypto/CryptoAssetSelector.vue';
import CheckoutMethodTiles from '~/modules/checkout/components/method/CheckoutMethodTiles.vue';
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
  appliedDiscountCode,
  fetchBreakdown,
  breakdownLoading,
  selectedPlan,
  breakdown,
  isCrypto,
  modelDiscountCode,
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

const { total } = useOrderTotals({ plan: selectedPlan, breakdown, upgrade: () => !!get(upgradeSubId) });

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
  <PaymentPage
    :title="subscriptionId || upgradeSubId ? t('checkout_crypto.pay_title') : undefined"
    :total="total"
    :total-note="t('checkout_crypto.paid_in_crypto')"
  >
    <template #alert>
      <CheckoutAlert
        v-if="error"
        :title="error.title"
        :message="error.message"
        @dismiss="clearError()"
      />
    </template>

    <template #methods>
      <CheckoutMethodTiles current="crypto" />
    </template>

    <CheckoutPanel
      aria-labelledby="crypto-asset-title"
      data-testid="crypto-panel"
    >
      <h2
        id="crypto-asset-title"
        class="text-lg md:text-xl font-semibold text-rui-text"
      >
        {{ t('checkout_crypto.choose_title') }}
      </h2>
      <CryptoAssetSelector v-model="selectedCurrency" />
      <p class="text-sm text-rui-text-secondary">
        {{ t('checkout_crypto.hold_price') }}
      </p>
      <PolicyConsent
        v-model="isRefundPolicyAccepted"
        policy-href="/refund-policy"
        :disabled="processing || loading"
      />
      <RuiButton
        :disabled="!valid || loading"
        :loading="processing"
        class="w-full sm:w-auto sm:self-start"
        color="primary"
        size="lg"
        @click="submit()"
      >
        {{ t('checkout_crypto.show_details') }}
      </RuiButton>
    </CheckoutPanel>

    <section
      class="flex flex-col gap-1 p-4 md:p-6 rounded-rui-card border border-dashed border-rui-outline"
      data-testid="crypto-send-placeholder"
    >
      <h2 class="text-lg md:text-xl font-semibold text-rui-text-secondary">
        {{ t('checkout_crypto.send_step') }}
      </h2>
      <p class="text-sm text-rui-text-secondary">
        {{ t('checkout_crypto.send_placeholder') }}
      </p>
    </section>

    <template #summary>
      <OrderSummaryCard
        v-model:discount-code="modelDiscountCode"
        :selected-plan="selectedPlan"
        :breakdown="breakdown"
        :upgrade-sub-id="upgradeSubId"
        :renewing="!!subscriptionId"
        :is-crypto="isCrypto"
        :loading="loading"
        :disabled="planSwitchLoading"
        @plan-change="switchPlan($event)"
        @apply-discount="applyDiscount()"
      />
    </template>
  </PaymentPage>

  <CheckoutLoadingOverlay :loading="loading" />
</template>
