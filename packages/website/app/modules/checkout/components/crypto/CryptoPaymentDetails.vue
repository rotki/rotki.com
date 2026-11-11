<script setup lang="ts">
import type { CryptoPayment } from '~/types';
import { get, set } from '@vueuse/shared';
import InputWithCopyButton from '~/components/common/InputWithCopyButton.vue';
import CryptoAssetIcon from '~/modules/checkout/components/crypto/CryptoAssetIcon.vue';
import CryptoPaymentQr from '~/modules/checkout/components/crypto/CryptoPaymentQr.vue';
import { segmentAfterFirst, truncateAddress } from '~/modules/web3/core/format';
import { toTitleCase } from '~/utils/text';

const { data, loading, walletOpen = false, manualOnly = false } = defineProps<{
  data: CryptoPayment;
  loading?: boolean;
  /** The wallet dialog is open, so the QR code steps aside. */
  walletOpen?: boolean;
  /** No wallet payment is offered (bitcoin), so this is the only way to pay. */
  manualOnly?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });

/** Phones only: the QR code is folded away, since it is scanned from another device. */
const showQr = ref<boolean>(false);

const currencyName = computed<string>(() => segmentAfterFirst(data.cryptocurrency, ':') ?? '');

const paymentAmount = computed<string>(() => `${data.finalPriceInCrypto} ${get(currencyName)}`);

function toggleQr(): void {
  set(showQr, !get(showQr));
}
</script>

<template>
  <div
    class="flex flex-col gap-3"
  >
    <h3 class="font-medium text-rui-text">
      {{ manualOnly ? t('checkout_crypto.manual_only_title') : t('checkout_crypto.manual_title') }}
    </h3>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-6 md:items-start">
      <div
        id="crypto-payment-qr"
        class="justify-center md:flex"
        :class="showQr ? 'flex' : 'hidden'"
      >
        <CryptoPaymentQr
          :data="data"
          :is-wallet-open="walletOpen"
          :loading="loading"
        />
      </div>
      <div class="flex flex-col gap-4 min-w-0">
        <InputWithCopyButton
          id="price"
          :model-value="paymentAmount"
          :label="t('common.amount')"
          hide-details
          readonly
          :copy-value="data.finalPriceInCrypto.toString()"
        >
          <template #prepend>
            <CryptoAssetIcon
              :icon-url="data.iconUrl"
              :name="currencyName"
            />
          </template>
        </InputWithCopyButton>

        <InputWithCopyButton
          id="address"
          :model-value="data.cryptoAddress"
          :label="t('checkout_crypto.to_address', { network: toTitleCase(data.chainName) })"
          hide-details
          readonly
          :copy-value="data.cryptoAddress"
        />

        <p
          v-if="data.tokenAddress"
          class="text-sm text-rui-text-secondary"
        >
          {{ t('home.plans.tiers.step_3.labels.token_contract') }}
          <RuiTooltip :open-delay="400">
            <template #activator>
              <span class="font-mono">{{ truncateAddress(data.tokenAddress, 8) }}</span>
            </template>
            {{ data.tokenAddress }}
          </RuiTooltip>
        </p>
      </div>
    </div>
    <button
      type="button"
      class="md:hidden self-start min-h-11 flex items-center gap-1.5 font-medium text-rui-primary"
      :aria-expanded="showQr"
      aria-controls="crypto-payment-qr"
      data-testid="crypto-qr-toggle"
      @click="toggleQr()"
    >
      {{ showQr ? t('checkout_crypto.hide_qr') : t('checkout_crypto.show_qr') }}
      <RuiIcon
        name="lu-chevron-down"
        size="18"
        :class="{ 'rotate-180': showQr }"
      />
    </button>
  </div>
</template>
