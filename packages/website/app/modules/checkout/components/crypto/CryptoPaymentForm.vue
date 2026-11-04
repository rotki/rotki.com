<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { CryptoPayment } from '~/types';
import { buildOrderSummary } from '@rotki/card-payment-common/utils/order-summary';
import PaymentPage from '@rotki/checkout-ui/components/PaymentPage.vue';
import { monthsToPlanDuration, SigilEvents } from '@rotki/sigil';
import { get } from '@vueuse/shared';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import OrderSummaryCard from '~/modules/checkout/components/common/OrderSummaryCard.vue';
import ChangeCryptoPayment from '~/modules/checkout/components/crypto/ChangeCryptoPayment.vue';
import CryptoAssetIcon from '~/modules/checkout/components/crypto/CryptoAssetIcon.vue';
import CryptoPaymentDetails from '~/modules/checkout/components/crypto/CryptoPaymentDetails.vue';
import CryptoWalletActions from '~/modules/checkout/components/crypto/CryptoWalletActions.vue';
import { useWeb3Payment } from '~/modules/checkout/composables/use-crypto-payment';
import { buildPaymentReceipt, storePaymentReceipt } from '~/modules/checkout/utils/payment-receipt';
import WalletAccountSummary from '~/modules/web3/components/WalletAccountSummary.vue';
import WalletPickerDialog from '~/modules/web3/components/WalletPickerDialog.vue';
import { web3ErrorKey } from '~/modules/web3/core/errors';
import { formatTokenBalance, segmentAfterFirst } from '~/modules/web3/core/format';
import { toTitleCase } from '~/utils/text';

const {
  data,
  plan,
  planSwitchLoading,
  web3ProcessingLoading,
  upgradeSubId,
  breakdown,
  discountCode,
} = defineProps<{
  data: CryptoPayment;
  plan: SelectedPlan;
  planSwitchLoading: boolean;
  web3ProcessingLoading: boolean;
  upgradeSubId?: string;
  breakdown?: PaymentBreakdownResponse;
  discountCode: string;
}>();

const emit = defineEmits<{
  'change': [];
  'plan-change': [plan: SelectedPlan];
  'apply-discount': [];
  'update:discount-code': [value: string];
  'error': [message: string];
}>();

defineSlots<{
  /** A page-level error, shown under the heading. */
  alert?: () => any;
}>();

const showChangePaymentDialog = ref<boolean>(false);

const { t } = useI18n({ useScope: 'global' });

const total = computed<string>(() => buildOrderSummary({ plan, breakdown, upgrade: !!upgradeSubId }).dueToday.formatted);

const { chronicle } = useSigilEvents();

async function navigateToSuccess(): Promise<void> {
  const discountInfo = breakdown?.discount;
  let discountType: 'referral' | 'discount' | undefined;
  if (discountInfo?.isValid === true)
    discountType = discountInfo.isReferral ? 'referral' : 'discount';

  chronicle(SigilEvents.PURCHASE_SUCCESS, {
    paymentMethod: 'crypto',
    planId: plan.planId,
    planName: plan.name,
    planDuration: monthsToPlanDuration(plan.durationInMonths),
    revenue: breakdown?.finalAmount ? Number.parseFloat(breakdown.finalAmount) : undefined,
    currency: 'EUR',
    isUpgrade: !!upgradeSubId,
    discount: discountType,
  });

  storePaymentReceipt(buildPaymentReceipt('crypto', plan, breakdown, !!upgradeSubId));
  await navigateTo({ name: 'checkout-success', query: { crypto: '1' } });
}

const {
  connected,
  address,
  balance,
  balanceLoading,
  fundsStatus,
  pay,
  processing,
  isOpen,
  open,
  isExpectedChain,
  switchNetwork,
} = useWeb3Payment(() => data, {
  onSuccess: navigateToSuccess,
});

async function handlePay(isUpgrade: boolean): Promise<void> {
  const result = await pay(isUpgrade);
  if (!result.ok)
    emit('error', t(web3ErrorKey(result.error), { message: result.error.message }));
}

async function handleSwitchNetwork(): Promise<void> {
  const result = await switchNetwork();
  if (!result.ok)
    emit('error', t(web3ErrorKey(result.error), { message: result.error.message }));
}

const isBtc = computed<boolean>(() => data.chainName === 'bitcoin');

// `cryptocurrency` is a full asset id (e.g. "ethereum sepolia:ETH"); show only the symbol.
const currencyName = computed<string>(() => segmentAfterFirst(data.cryptocurrency, ':') ?? data.cryptocurrency);

const networkName = computed<string>(() => toTitleCase(data.chainName));

const cryptoAmount = computed<string>(() => `${data.finalPriceInCrypto} ${get(currencyName)}`);

const panelClass = 'flex flex-col gap-4 p-4 md:p-6 bg-rui-surface border border-rui-divider rounded-rui-card';

function handleInternalPlanChange(newPlan: SelectedPlan): void {
  emit('plan-change', newPlan);
}
</script>

<template>
  <PaymentPage
    :title="t('checkout_crypto.send_title')"
    :total="total"
    :total-note="t('checkout_crypto.amount_on_network', { amount: cryptoAmount, network: networkName })"
  >
    <template
      v-if="$slots.alert"
      #alert
    >
      <slot name="alert" />
    </template>

    <section
      aria-labelledby="crypto-asset-title"
      :class="panelClass"
      data-cy="crypto-asset-panel"
    >
      <div class="flex items-center justify-between gap-4">
        <h2
          id="crypto-asset-title"
          class="text-lg md:text-xl font-semibold text-rui-text"
        >
          {{ t('checkout_crypto.network_title') }}
        </h2>
        <RuiButton
          :disabled="planSwitchLoading || web3ProcessingLoading || processing"
          variant="text"
          color="primary"
          data-cy="change-crypto-asset"
          @click="showChangePaymentDialog = true"
        >
          {{ t('actions.change') }}
        </RuiButton>
      </div>
      <div class="flex items-center gap-3">
        <CryptoAssetIcon
          :icon-url="data.iconUrl"
          :name="currencyName"
        />
        <i18n-t
          keypath="checkout_crypto.asset_on_network"
          tag="span"
        >
          <template #token>
            <strong class="font-medium">{{ currencyName }}</strong>
          </template>
          <template #network>
            {{ networkName }}
          </template>
        </i18n-t>
      </div>
    </section>

    <section
      aria-labelledby="crypto-send-title"
      :class="panelClass"
      data-cy="crypto-payment-panel"
    >
      <h2
        id="crypto-send-title"
        class="text-lg md:text-xl font-semibold text-rui-text"
      >
        {{ t('checkout_crypto.send_step') }}
      </h2>
      <div
        role="status"
        class="flex items-center gap-2 px-4 py-3 rounded-rui-control bg-rui-primary-subtle text-sm text-rui-text"
      >
        <span
          aria-hidden="true"
          class="size-2 rounded-full bg-rui-primary"
        />
        {{ t('checkout_crypto.waiting') }}
      </div>
      <p
        class="px-4 py-3 rounded-rui-control border border-rui-warning-border bg-rui-warning-subtle text-sm text-rui-warning-darker"
        data-cy="crypto-exact-amount"
      >
        <strong class="font-semibold">{{ t('checkout_crypto.exact_amount', { amount: cryptoAmount, network: networkName }) }}</strong>
        {{ t('checkout_crypto.exact_amount_detail') }}
      </p>

      <div
        v-if="!isBtc"
        class="flex flex-col gap-3"
      >
        <!-- Connected wallet, next to the action that uses it. -->
        <div
          v-if="connected && address"
          class="flex flex-col gap-2"
        >
          <WalletAccountSummary
            :address="address"
            :open="open"
          />

          <!-- Reserve a line so the balance never shifts the layout. -->
          <div
            v-if="isExpectedChain"
            class="flex items-center gap-1.5 text-sm text-rui-text-secondary px-1 h-5"
          >
            <RuiSkeletonLoader
              v-if="balanceLoading"
              class="w-36 h-4"
            />
            <template v-else-if="balance">
              {{ t('subscription.crypto_payment.wallet_balance', { balance: formatTokenBalance(balance), currency: currencyName }) }}
            </template>
          </div>
        </div>

        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <CryptoWalletActions
            :connected="connected"
            :is-expected-chain="isExpectedChain"
            :pay-disabled="fundsStatus.tokenShortfall"
            :processing="web3ProcessingLoading || planSwitchLoading || processing"
            @connect="open()"
            @pay="handlePay(!!upgradeSubId)"
            @switch-network="handleSwitchNetwork()"
          />
          <span
            v-if="!connected"
            class="text-sm text-rui-text-secondary"
          >
            {{ t('checkout_crypto.wallet_hint') }}
          </span>
          <span
            v-else-if="!isExpectedChain"
            class="text-sm text-rui-text-secondary"
            data-cy="crypto-switch-hint"
          >
            {{ t('checkout_crypto.switch_hint', { network: networkName }) }}
          </span>
        </div>

        <!-- Hard block: balance below the amount due -->
        <RuiAlert
          v-if="connected && isExpectedChain && fundsStatus.tokenShortfall"
          type="error"
        >
          {{ t('subscription.crypto_payment.insufficient_funds', { currency: currencyName }) }}
        </RuiAlert>

        <!-- Soft warning: enough for the amount, maybe not for gas -->
        <RuiAlert
          v-else-if="connected && isExpectedChain && fundsStatus.gasShortfall"
          type="warning"
        >
          {{ t('subscription.crypto_payment.insufficient_gas') }}
        </RuiAlert>
      </div>

      <div :class="{ 'pt-4 border-t border-rui-divider': !isBtc }">
        <CryptoPaymentDetails
          :data="data"
          :loading="planSwitchLoading"
          :wallet-open="isOpen"
          :manual-only="isBtc"
        />
      </div>

      <p class="text-sm text-rui-text-secondary">
        {{ t('checkout_crypto.already_sent') }}
      </p>
    </section>

    <template #summary>
      <OrderSummaryCard
        :discount-code="discountCode"
        warning
        :selected-plan="plan"
        :breakdown="breakdown"
        :upgrade-sub-id="upgradeSubId"
        is-crypto
        :loading="planSwitchLoading"
        :disabled="planSwitchLoading || web3ProcessingLoading || processing"
        @update:discount-code="emit('update:discount-code', $event)"
        @plan-change="handleInternalPlanChange($event)"
        @apply-discount="emit('apply-discount')"
      />
    </template>
  </PaymentPage>

  <!-- Change Payment Dialog -->
  <ChangeCryptoPayment
    v-model="showChangePaymentDialog"
    @change="emit('change')"
  />

  <!-- Processing overlay -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-in-out"
      leave-active-class="transition-opacity duration-300 ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      appear
    >
      <div
        v-if="processing"
        class="fixed inset-0 z-rui-blocking flex items-center justify-center bg-black/80 backdrop-blur-xs"
      >
        <div class="flex flex-col items-center justify-center text-center px-4">
          <div class="mb-4">
            <RuiProgress
              variant="indeterminate"
              size="48"
              circular
              color="primary"
            />
          </div>
          <h3 class="text-lg font-medium text-white mb-1">
            {{ t('subscription.progress.payment_progress') }}
          </h3>
          <p class="text-white/80">
            {{ t('subscription.progress.payment_progress_message') }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>

  <WalletPickerDialog />
</template>
