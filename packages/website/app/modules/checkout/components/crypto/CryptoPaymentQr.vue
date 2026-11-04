<script setup lang="ts">
import type { CryptoPayment } from '~/types';
import { useClipboard } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { buildPaymentUri } from '~/modules/web3/core/payment-uri';
import { useLogger } from '~/utils/use-logger';

const { data, isWalletOpen, loading } = defineProps<{
  data: CryptoPayment;
  isWalletOpen: boolean;
  loading?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });

const qrText = ref<string>('');
const canvas = useTemplateRef('canvas');

const logger = useLogger('crypto-payment-qr');
const { copy: copyToClipboard } = useClipboard({ source: qrText });

/** Lazy-loads the qrcode library so it stays out of the initial bundle. */
async function getToCanvas(): Promise<typeof import('qrcode').toCanvas> {
  const { toCanvas } = await import('qrcode');
  return toCanvas;
}

/**
 * Generate QR code for crypto payment
 */
async function createPaymentQR(payment: CryptoPayment, canvas: HTMLCanvasElement): Promise<string> {
  const qrText = await buildPaymentUri(payment);
  logger.info(qrText);
  const toCanvas = await getToCanvas();
  await toCanvas(canvas, qrText);
  return qrText;
}

/** Copies the payment link the QR code holds. */
function handleQRClick(): void {
  copyToClipboard(get(qrText));
}

/**
 * Watch for canvas changes and generate QR code
 */
watch(canvas, async (canvas) => {
  if (!canvas)
    return;

  set(qrText, await createPaymentQR(data, canvas));
});
</script>

<template>
  <div
    class="size-40 shrink-0 rounded-rui-control border border-rui-divider bg-white overflow-hidden"
    data-cy="crypto-payment-qr"
  >
    <div
      v-if="loading"
      class="size-full flex items-center justify-center"
    >
      <RuiProgress
        circular
        color="primary"
        size="32"
        thickness="3"
        variant="indeterminate"
      />
    </div>
    <canvas
      v-else-if="!isWalletOpen"
      ref="canvas"
      :title="t('home.plans.tiers.step_3.qr.click_to_copy')"
      class="size-full! cursor-pointer"
      @click="handleQRClick()"
    />
    <div
      v-else
      class="size-full flex flex-col items-center justify-center gap-2 p-3 text-center text-sm text-rui-text-secondary bg-rui-surface-muted"
    >
      <RuiIcon
        name="lu-wallet"
        size="32"
      />
      {{ t('home.plans.tiers.step_3.wallet.connected') }}
    </div>
  </div>
</template>
