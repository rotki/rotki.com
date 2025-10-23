<script setup lang="ts">
import type { CryptoPayment } from '~/types';
import { get, set, useClipboard } from '@vueuse/core';
import { parseUnits } from 'ethers';
import { toCanvas } from 'qrcode';
import { useLogger } from '~/utils/use-logger';

const props = defineProps<{
  data: CryptoPayment;
  isWalletOpen: boolean;
  loading?: boolean;
}>();

const { data, isWalletOpen, loading } = toRefs(props);

const canvas = useTemplateRef('canvas');
const qrText = ref<string>('');

const logger = useLogger('crypto-payment-qr');
const { copy: copyToClipboard } = useClipboard({ source: qrText });
const { t } = useI18n({ useScope: 'global' });

/**
 * Generate QR code for crypto payment
 */
async function createPaymentQR(payment: CryptoPayment, canvas: HTMLCanvasElement): Promise<string> {
  let qrText: string;
  const {
    cryptoAddress,
    chainName,
    finalPriceInCrypto,
    tokenAddress,
    decimals,
  } = payment;

  if (chainName === 'bitcoin') {
    qrText = `bitcoin:${cryptoAddress}?amount=${finalPriceInCrypto}&label=Rotki`;
  }
  else {
    const chainId = payment.chainId;
    const tokenAmount = parseUnits(finalPriceInCrypto.toString(), decimals);

    if (!tokenAddress)
      qrText = `ethereum:${cryptoAddress}@${chainId}?value=${tokenAmount}`;
    else
      qrText = `ethereum:${tokenAddress}@${chainId}/transfer?address=${cryptoAddress}&uint256=${tokenAmount}`;
  }

  logger.info(qrText);
  await toCanvas(canvas, qrText);
  return qrText;
}

/**
 * Handle QR code click to copy
 */
function handleQRClick(): void {
  copyToClipboard(get(qrText));
  // Could add toast notification here
}

/**
 * Watch for canvas changes and generate QR code
 */
watch(canvas, async (canvas) => {
  if (!canvas)
    return;

  set(qrText, await createPaymentQR(get(data), canvas));
});
</script>

<template>
  <div class="qr-code-section">
    <div class="flex justify-center mb-3">
      <div class="border mx-auto rounded-md">
        <!-- Loading placeholder -->
        <div
          v-if="loading"
          class="w-[11.25rem] h-[11.25rem] flex items-center justify-center bg-rui-grey-100 dark:bg-rui-grey-800 rounded"
        >
          <div class="text-center text-rui-text-secondary">
            <RuiProgress
              circular
              color="primary"
              size="32"
              thickness="3"
              variant="indeterminate"
              class="mb-2"
            />
            <p class="text-sm">
              {{ t('subscription.progress.processing') }}
            </p>
          </div>
        </div>
        <!-- QR Canvas -->
        <canvas
          v-else-if="!isWalletOpen"
          ref="canvas"
          class="w-[11.25rem] h-[11.25rem] cursor-pointer rounded transition-all duration-200 hover:shadow-md"
          @click="handleQRClick()"
        />

        <div
          v-else
          class="w-[11.25rem] h-[11.25rem] flex items-center justify-center bg-rui-grey-100 dark:bg-rui-grey-800 rounded"
        >
          <div class="text-center text-rui-text-secondary">
            <RuiIcon
              name="lu-wallet"
              size="32"
              class="mb-2"
            />
            <p class="text-sm">
              {{ t('home.plans.tiers.step_3.wallet.connected') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <p class="text-center text-sm text-rui-text-secondary">
      {{ t('home.plans.tiers.step_3.qr.click_to_copy') }}
    </p>
  </div>
</template>
