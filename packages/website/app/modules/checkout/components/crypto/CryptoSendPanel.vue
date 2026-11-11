<script setup lang="ts">
import type { CryptoPayment } from '~/types';
import CheckoutPanel from '@rotki/checkout-ui/components/CheckoutPanel.vue';
import ProcessingOverlay from '@rotki/checkout-ui/components/ProcessingOverlay.vue';
import { set } from '@vueuse/shared';
import CryptoPaymentDetails from '~/modules/checkout/components/crypto/CryptoPaymentDetails.vue';
import CryptoWalletActions from '~/modules/checkout/components/crypto/CryptoWalletActions.vue';
import { useWeb3Payment } from '~/modules/checkout/composables/use-crypto-payment';
import { type CryptoPaymentLabels, cryptoPaymentLabels } from '~/modules/checkout/utils/crypto-payment-labels';
import WalletAccountSummary from '~/modules/web3/components/WalletAccountSummary.vue';
import WalletPickerDialog from '~/modules/web3/components/WalletPickerDialog.vue';
import { web3ErrorKey } from '~/modules/web3/core/errors';
import { formatTokenBalance } from '~/modules/web3/core/format';

/** A wallet payment is in flight, so the page locks what could change the order. */
const modelBusy = defineModel<boolean>('busy', { default: false });

const { data, upgrade = false, disabled = false } = defineProps<{
  data: CryptoPayment;
  upgrade?: boolean;
  /** The order is changing elsewhere on the page. */
  disabled?: boolean;
}>();

const emit = defineEmits<{
  /** The wallet sent the payment. */
  paid: [];
  /** A wallet action failed. */
  error: [failure: { title: string; message: string }];
  /** The buyer tries a wallet action, so an earlier error no longer applies. */
  attempt: [];
}>();

const { t } = useI18n({ useScope: 'global' });

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
  onSuccess: async () => emit('paid'),
});

const labels = computed<CryptoPaymentLabels>(() => cryptoPaymentLabels(data));

const isBtc = computed<boolean>(() => data.chainName === 'bitcoin');

async function handlePay(): Promise<void> {
  emit('attempt');
  const result = await pay(upgrade);
  if (!result.ok) {
    emit('error', {
      title: result.error._tag === 'WalletNoAnswer' ? t('checkout_crypto.wallet_waiting_title') : t('checkout_crypto.not_sent_title'),
      message: t(web3ErrorKey(result.error), { message: result.error.message }),
    });
  }
}

async function handleSwitchNetwork(): Promise<void> {
  emit('attempt');
  const result = await switchNetwork();
  if (!result.ok)
    emit('error', { title: t('checkout_crypto.switch_failed_title'), message: t(web3ErrorKey(result.error), { message: result.error.message }) });
}

watch(processing, (busy) => {
  set(modelBusy, busy);
}, { immediate: true });
</script>

<template>
  <CheckoutPanel
    aria-labelledby="crypto-send-title"
    data-testid="crypto-payment-panel"
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
      data-testid="crypto-exact-amount"
    >
      <strong class="font-semibold">{{ t('checkout_crypto.exact_amount', { amount: labels.amount, network: labels.network }) }}</strong>
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
            {{ t('subscription.crypto_payment.wallet_balance', { balance: formatTokenBalance(balance), currency: labels.token }) }}
          </template>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <CryptoWalletActions
          :connected="connected"
          :is-expected-chain="isExpectedChain"
          :pay-disabled="fundsStatus.tokenShortfall"
          :processing="disabled || processing"
          @connect="open()"
          @pay="handlePay()"
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
          data-testid="crypto-switch-hint"
        >
          {{ t('checkout_crypto.switch_hint', { network: labels.network }) }}
        </span>
      </div>

      <!-- Hard block: balance below the amount due -->
      <RuiAlert
        v-if="connected && isExpectedChain && fundsStatus.tokenShortfall"
        type="error"
      >
        {{ t('subscription.crypto_payment.insufficient_funds', { currency: labels.token }) }}
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
        :loading="disabled"
        :wallet-open="isOpen"
        :manual-only="isBtc"
      />
    </div>

    <p class="text-sm text-rui-text-secondary">
      {{ t('checkout_crypto.already_sent') }}
    </p>
  </CheckoutPanel>

  <ProcessingOverlay
    :visible="processing"
    :message="t('subscription.progress.payment_progress_message')"
  />

  <WalletPickerDialog />
</template>
