<template>
  <error-display
    v-if="error"
    :class="$style.body"
    :message="error"
    title="Error"
  >
    <div :class="$style['action-wrapper']">
      <button :class="$style.action" @click="clearError">Close</button>
    </div>
  </error-display>
  <div
    v-else-if="!pending"
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
    <plan-overview>
      <div>{{ getPlanName(plan) }} Plan</div>
      <div>
        {{ data.finalPriceInEur }}€ ({{ data.finalPriceInCrypto }}
        {{ data.cryptocurrency }})
        <span v-if="data.vat">includes {{ data.vat }}% VAT</span>
      </div>
    </plan-overview>
    <div v-if="!isBtc" :class="$style.button">
      <accept-refund-policy
        v-model="refundPolicyAccepted"
        :class="$style.policy"
      />
      <action-button
        :disabled="!metamaskSupport || !refundPolicyAccepted"
        text="Pay with Metamask"
        @click="payWithMetamask"
      >
        <metamask-icon :class="$style.icon" />
      </action-button>
    </div>
    <div v-else>
      Before proceeding with the payment please read our
      <nuxt-link :class="$style.link" target="_blank" to="/refund-policy">
        Refunds/Cancellation Policy
      </nuxt-link>
    </div>
  </div>
  <div v-else :class="$style.body">
    <pending-display
      v-if="!done"
      message="Please wait for the transaction to be confirmed"
      title="Pending Transaction"
    />
    <success-display
      v-else
      message="Transaction done, you will receive an e-mail confirming the activation of
      your subscription"
      title="Transaction Confirmed"
    >
      <div :class="$style['action-wrapper']">
        <nuxt-link :class="$style.action" to="/home">
          Account Management
        </nuxt-link>
      </div>
    </success-display>
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
import { CryptoPayment, Provider } from '~/types'
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
  setup(props) {
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

    const { payWithMetamask, state, error, clearError } = setupWeb3Payments(
      data,
      () => {
        assert(provider)
        return provider
      }
    )

    const pending = computed(() => get(state) !== PaymentState.NONE)
    const done = computed(() => get(state) === PaymentState.DONE)
    const isBtc = computed(() => get(data).cryptocurrency === 'BTC')

    return {
      isBtc,
      metamaskSupport,
      refundPolicyAccepted,
      payWithMetamask,
      copyToClipboard,
      canvas,
      paymentAmount,
      pending,
      done,
      error,
      getPlanName,
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

.body {
  margin-top: 48px;
  margin-bottom: 48px;
}

.action {
  @apply text-primary3 text-center mt-3 mb-1;
}

.action-wrapper {
  @apply flex flex-row justify-center;
}

.policy {
  margin-bottom: 24px;
}

.link {
  @apply text-primary3;

  margin-top: 24px;
}
</style>
