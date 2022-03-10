<template>
  <div
    :class="{
      [$style.wrapper]: true,
      [$style.body]: true,
    }"
  >
    <div :class="$style.row">
      <div :class="$style.qrcode">
        <canvas ref="canvas" @click="copyToClipboard" />
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
  onMounted,
  PropType,
  ref,
  toRefs,
  watch,
} from '@nuxtjs/composition-api'
import detectEthereumProvider from '@metamask/detect-provider'
import { ethers } from 'ethers'
import { toCanvas } from 'qrcode'
import { get } from '@vueuse/core'
import { CryptoPayment, IdleStep, Provider, StepType } from '~/types'
import { assert } from '~/utils/assert'
import { logger } from '~/utils/logger'
import { PaymentState, setupWeb3Payments } from '~/composables/crypto-payment'
import { getPlanName } from '~/components/checkout/plan/utils'

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
  },
  emits: ['update:state', 'update:error'],
  setup(props, { emit }) {
    const { data } = toRefs(props)
    const metamaskSupport = ref(false)
    const refundPolicyAccepted = ref(false)
    const canvas = ref<HTMLCanvasElement>()
    const qrText = ref('')

    const paymentAmount = computed(() => {
      const { cryptocurrency, finalPriceInCrypto } = data.value
      return `${finalPriceInCrypto} ${cryptocurrency}`
    })
    let provider: Provider | null = null

    watch(canvas, async (canvas) => {
      if (!canvas) {
        return
      }
      qrText.value = await createPaymentQR(data.value, canvas)
    })

    onMounted(async () => {
      provider = (await detectEthereumProvider()) as Provider | null
      metamaskSupport.value = !!provider
    })

    const copyToClipboard = () => {
      navigator.clipboard.writeText(qrText.value)
    }

    const { payWithMetamask, state, error } = setupWeb3Payments(data, () => {
      assert(provider)
      return provider
    })

    watch(error, (error) => emit('update:error', error))

    watch(state, (state) => {
      let paymentState: StepType | IdleStep = 'idle'
      if (state === PaymentState.WAIT) {
        paymentState = 'pending'
      } else if (state === PaymentState.DONE) {
        paymentState = 'success'
      }
      emit('update:state', paymentState)
    })

    const isBtc = computed(() => get(data).cryptocurrency === 'BTC')

    return {
      isBtc,
      metamaskSupport,
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
</style>
