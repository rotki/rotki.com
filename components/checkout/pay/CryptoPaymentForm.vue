<template>
  <div
    :class="{
      [$style.wrapper]: true,
      [$style.body]: true,
    }"
  >
    <div :class="$style.row">
      <div :class="$style.qrcode">
        <canvas ref="canvas" @click="copyToClipboard()" />
      </div>
      <div :class="$style.inputs">
        <input-field
          id="price"
          :class="$style.fields"
          :value="paymentAmount"
          label="Amount"
          readonly
        >
          <template #append>
            <div :class="$style.copy">
              <copy-button :value="data.finalPriceInCrypto" />
            </div>
          </template>
        </input-field>
        <input-field
          id="address"
          :class="$style.fields"
          :value="data.cryptoAddress"
          label="Address"
          readonly
        >
          <template #append>
            <div :class="$style.copy">
              <copy-button :value="data.cryptoAddress" />
            </div>
          </template>
        </input-field>
      </div>
    </div>
    <div :class="$style.hint">
      You can pay with metamask, your mobile wallet or manually send the exact
      amount to the following address above. Once the whole amount is sent and
      manually processed, then a receipt will be sent to your email and your
      subscription will be activated.

      <div :class="$style.info">
        If you already have a made a transaction you don't need to do anything
        more.
        <div>
          You will be notified about your subscription via e-mail as soon as
          your transaction is confirmed.
        </div>
      </div>
    </div>
    <div v-if="!isBtc" :class="$style.button">
      <selection-button
        :selected="false"
        :disabled="!metamaskSupport"
        @click="payWithMetamask"
      >
        <div :class="$style.row">
          <metamask-icon :class="$style.icon" />
          Pay with Metamask
        </div>
      </selection-button>
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  PropType,
  ref,
  toRefs,
  watch,
} from '@nuxtjs/composition-api'
import { ethers } from 'ethers'
import { toCanvas } from 'qrcode'
import { get, set, useClipboard } from '@vueuse/core'
import { CryptoPayment } from '~/types'
import { logger } from '~/utils/logger'
import { getPlanName } from '~/utils/plans'

async function createPaymentQR(
  payment: CryptoPayment,
  canvas: HTMLCanvasElement
) {
  const dai = '0x11fE4B6AE13d2a6055C8D9cF65c55bac32B5d844'
  let qrText = ''
  if (payment.cryptocurrency === 'BTC') {
    qrText = `bitcoin:${payment.cryptoAddress}?amount=${payment.finalPriceInCrypto}&label=Rotki`
  } else if (payment.cryptocurrency === 'ETH') {
    const ethPrice = ethers.utils.parseEther(payment.finalPriceInCrypto)
    qrText = `ethereum:${payment.cryptoAddress}?value=${ethPrice.toString()}`
  } else if (payment.cryptocurrency === 'DAI') {
    const daiPrice = ethers.utils.parseUnits(payment.finalPriceInCrypto, 18)
    qrText = `ethereum:${payment.cryptoAddress}/transfer?address=${dai}&uint256=${daiPrice}`
  }

  logger.info(qrText)
  await toCanvas(canvas, qrText)
  return qrText
}

export default defineComponent({
  name: 'CryptoPaymentForm',
  props: {
    data: {
      required: true,
      type: Object as PropType<CryptoPayment>,
    },
    plan: {
      required: true,
      type: Number,
    },
    metamaskSupport: {
      required: true,
      type: Boolean,
    },
  },
  emits: ['pay'],
  setup(props, { emit }) {
    const { data } = toRefs(props)
    const refundPolicyAccepted = ref(false)
    const canvas = ref<HTMLCanvasElement>()
    const qrText = ref('')

    const paymentAmount = computed(() => {
      const { cryptocurrency, finalPriceInCrypto } = get(data)
      return `${finalPriceInCrypto} ${cryptocurrency}`
    })

    watch(canvas, async (canvas) => {
      if (!canvas) {
        return
      }
      set(qrText, await createPaymentQR(get(data), canvas))
    })

    const { copy: copyToClipboard } = useClipboard({ source: qrText })
    const isBtc = computed(() => get(data).cryptocurrency === 'BTC')

    const payWithMetamask = () => emit('pay')

    return {
      isBtc,
      refundPolicyAccepted,
      payWithMetamask,
      copyToClipboard,
      canvas,
      paymentAmount,
      getPlanName,
    }
  },
})
</script>

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
