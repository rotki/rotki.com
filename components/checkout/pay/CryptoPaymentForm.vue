<template>
  <error-display v-if="error" :message="error" title="Error">
    <button @click="clearError">close</button>
  </error-display>
  <div v-else-if="!pending" :class="$style.wrapper">
    <div :class="$style.row">
      <div :class="$style.qrcode">
        <canvas ref="canvas" />
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
    <div :class="$style.button">
      <action-button
        :disabled="!metamaskSupport"
        text="Pay with Metamask"
        @click="payWithMetamask"
      >
        <metamask-icon :class="$style.icon" />
      </action-button>
    </div>
  </div>
  <div v-else>
    <div v-if="!done">
      <loader> Please wait for the transaction </loader>
    </div>
    <div v-else>
      <success-display
        message="Transaction done, you will receive an e-mail confirming the activation of
      your subscription"
        title="Transaction Confirmed"
      />
    </div>
  </div>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  PropType,
  ref,
  toRefs,
} from '@nuxtjs/composition-api'
import detectEthereumProvider from '@metamask/detect-provider'
import { ethers } from 'ethers'
import { toCanvas } from 'qrcode'
import { CryptoPayment, Provider } from '~/types'
import { assert } from '~/utils/assert'
import { logger } from '~/utils/logger'
import { PaymentState, setupWeb3Payments } from '~/composables/crypto-payment'

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
}

export default defineComponent({
  name: 'CryptoPaymentForm',
  props: {
    data: {
      required: true,
      type: Object as PropType<CryptoPayment>,
    },
  },
  setup(props) {
    const { data } = toRefs(props)
    const metamaskSupport = ref(false)
    const canvas = ref<HTMLCanvasElement>()

    const paymentAmount = computed(() => {
      const { cryptocurrency, finalPriceInCrypto } = data.value
      return `${finalPriceInCrypto} ${cryptocurrency}`
    })
    let provider: Provider | null = null

    onMounted(async () => {
      provider = (await detectEthereumProvider()) as Provider | null
      metamaskSupport.value = !!provider
      const payment = data.value
      if (canvas.value) {
        await createPaymentQR(payment, canvas.value)
      }
    })

    const { payWithMetamask, state, error, clearError } = setupWeb3Payments(
      data,
      () => {
        assert(provider)
        return provider
      }
    )

    const pending = computed(() => {
      return state.value !== PaymentState.NONE
    })

    const done = computed(() => {
      return state.value === PaymentState.DONE
    })

    return {
      metamaskSupport,
      payWithMetamask,
      canvas,
      paymentAmount,
      pending,
      done,
      error,
      clearError,
    }
  },
})
</script>

<style lang="scss" module>
.wrapper {
  @apply flex flex-col;
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
  @apply mt-2;
}

.icon {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}
</style>
