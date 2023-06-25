<script setup lang="ts">
import { parseEther, parseUnits } from 'ethers';
import { toCanvas } from 'qrcode';
import { get, set, useClipboard } from '@vueuse/core';
import { type CryptoPayment } from '~/types';
import { logger } from '~/utils/logger';

const config = useRuntimeConfig();

const createPaymentQR = async (
  payment: CryptoPayment,
  canvas: HTMLCanvasElement
) => {
  let qrText = '';
  const chainId = getChainId(!!config.public.testing);
  if (payment.cryptocurrency === 'BTC') {
    qrText = `bitcoin:${payment.cryptoAddress}?amount=${payment.finalPriceInCrypto}&label=Rotki`;
  } else if (payment.cryptocurrency === 'ETH') {
    const ethPrice = parseEther(payment.finalPriceInCrypto);
    qrText = `ethereum:${
      payment.cryptoAddress
    }@${chainId}?value=${ethPrice.toString()}`;
  } else if (payment.cryptocurrency === 'DAI') {
    const tokenPrice = parseUnits(payment.finalPriceInCrypto, 18);
    qrText = `ethereum:${payment.tokenAddress}@${chainId}/transfer?address=${payment.cryptoAddress}&uint256=${tokenPrice}`;
  }

  logger.info(qrText);
  await toCanvas(canvas, qrText);
  return qrText;
};

const props = defineProps<{
  data: CryptoPayment;
  plan: number;
  metamaskSupport: boolean;
}>();

const emit = defineEmits<{ (e: 'pay'): void }>();

const { data } = toRefs(props);
const canvas = ref<HTMLCanvasElement>();
const qrText = ref<string>('');

const paymentAmount = computed(() => {
  const { cryptocurrency, finalPriceInCrypto } = get(data);
  return `${finalPriceInCrypto} ${cryptocurrency}`;
});

watch(canvas, async (canvas) => {
  if (!canvas) {
    return;
  }
  set(qrText, await createPaymentQR(get(data), canvas));
});

const { copy: copyToClipboard } = useClipboard({ source: qrText });
const isBtc = computed(() => get(data).cryptocurrency === 'BTC');

const payWithMetamask = () => emit('pay');
const css = useCssModule();
</script>

<template>
  <div
    :class="{
      [css.wrapper]: true,
      [css.body]: true,
    }"
  >
    <div :class="css.row">
      <div :class="css.qrcode">
        <canvas ref="canvas" @click="copyToClipboard(qrText)" />
      </div>
      <div :class="css.inputs">
        <InputField
          id="price"
          :class="css.fields"
          :model-value="paymentAmount"
          label="Amount"
          readonly
        >
          <template #append>
            <div :class="css.copy">
              <CopyButton :model-value="data.finalPriceInCrypto" />
            </div>
          </template>
        </InputField>
        <InputField
          id="address"
          :class="css.fields"
          :model-value="data.cryptoAddress"
          label="Address"
          readonly
        >
          <template #append>
            <div :class="css.copy">
              <CopyButton :model-value="data.cryptoAddress" />
            </div>
          </template>
        </InputField>
      </div>
    </div>
    <SelectedPlanOverview :plan="data" crypto warning />
    <div :class="css.hint">
      You can pay with metamask, your mobile wallet or manually send the exact
      amount to the following address above. Once the whole amount is sent and
      manually processed, then a receipt will be sent to your email and your
      subscription will be activated.

      <div :class="css.info">
        If you already have a made a transaction you don't need to do anything
        more.
        <div>
          You will be notified about your subscription via e-mail as soon as
          your transaction is confirmed.
        </div>
      </div>
    </div>
    <div v-if="!isBtc" :class="css.button">
      <SelectionButton
        :selected="false"
        :disabled="!metamaskSupport"
        @click="payWithMetamask()"
      >
        <div :class="css.row">
          <MetamaskIcon :class="css.icon" />
          Pay with Metamask
        </div>
      </SelectionButton>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply flex flex-col mt-4;
}

.row {
  @apply flex flex-row;
}

.qrcode {
  @apply border m-4;
}

.inputs {
  @apply flex flex-col justify-center ml-3;
}

.fields {
  width: 450px;
}

.copy {
  @apply flex flex-row items-center mt-2 ml-2;
}

.button {
  @apply mt-4;
}

.icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.hint {
  @apply text-shade8 mt-4 mb-4;
}

.info {
  @apply font-bold mt-3 text-shade12;
}
</style>
