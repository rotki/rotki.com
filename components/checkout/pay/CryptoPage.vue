<template>
  <payment-frame :loading="loading" :step="step" @close="reset">
    <template #description>
      <div :class="$style.description">
        Payments by crypto can have slower processing times.
      </div>
    </template>
    <div :class="$style.row">
      <div>
        <crypto-payment-form
          v-if="data"
          :data="data"
          :plan="plan"
          :metamask-support="metamaskSupport"
          @pay="payWithMetamask"
        />
      </div>
    </div>
  </payment-frame>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  useRouter,
} from '@nuxtjs/composition-api'
import { get, set } from '@vueuse/core'
import detectEthereumProvider from '@metamask/detect-provider'
import { CryptoPayment, PaymentStep, Provider } from '~/types'
import {
  useCurrencyParams,
  usePlanParams,
  useSubscriptionIdParam,
} from '~/composables/plan'
import { useMainStore } from '~/store'
import { setupWeb3Payments } from '~/composables/crypto-payment'
import { assert } from '~/utils/assert'
import { useRuntimeConfig } from '~/composables/utils'

export default defineComponent({
  name: 'CryptoPage',
  setup() {
    const store = useMainStore()
    const { plan } = usePlanParams()
    const { currency } = useCurrencyParams()
    const { subscriptionId } = useSubscriptionIdParam()
    const loading = ref(false)
    const data = ref<CryptoPayment | null>(null)
    const router = useRouter()
    const metamaskSupport = ref(false)
    let provider: Provider | null = null

    onMounted(async () => {
      const selectedPlan = get(plan)
      const selectedCurrency = get(currency)
      if (selectedPlan > 0 && selectedCurrency) {
        provider = (await detectEthereumProvider()) as Provider | null
        metamaskSupport.value = !!provider
        set(loading, true)
        const subId = get(subscriptionId)
        const result = await store.cryptoPayment(
          selectedPlan,
          selectedCurrency,
          subId
        )
        if (result.isError) {
          set(error, result.error.message)
        } else {
          set(data, result.result)
        }

        set(loading, false)
      } else {
        router.push('/products')
      }
    })

    const isBtc = computed(() => get(data)?.cryptocurrency === 'BTC')
    const step = computed<PaymentStep>(() => {
      const errorMessage = get(error)
      const state = get(currentState)
      if (errorMessage) {
        return {
          type: 'failure',
          title: 'Payment Failure',
          message: errorMessage,
          closeable: true,
        }
      } else if (state === 'pending') {
        return {
          type: 'pending',
          title: 'Payment in Progress',
          message: 'Please confirm your transaction...',
        }
      } else if (state === 'success') {
        return {
          type: 'success',
          title: 'Transaction Pending',
          message:
            'You should receive an e-mail confirming the activation of your subscription in the near future.',
        }
      } else {
        return { type: 'idle' }
      }
    })

    const reset = () => {
      set(currentState, 'idle')
      set(error, '')
    }

    const config = useRuntimeConfig()
    const { payWithMetamask, state: currentState, error } = setupWeb3Payments(
      data,
      () => {
        assert(provider)
        return provider
      },
      !!config.testing
    )

    return {
      isBtc,
      data,
      step,
      plan,
      loading,
      error,
      currentState,
      metamaskSupport,
      payWithMetamask,
      reset,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';

.description {
  max-width: 600px;

  @include text-size(18px, 21px);
}
</style>
