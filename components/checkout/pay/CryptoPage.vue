<template>
  <payment-frame :loading="loading" :step="step">
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
          @update:state="currentState = $event"
          @update:error="error = $event"
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
import { CryptoPayment, IdleStep, PaymentStep, StepType } from '~/types'
import {
  useCurrencyParams,
  usePlanParams,
  useSubscriptionIdParam,
} from '~/composables/plan'
import { useMainStore } from '~/store'

export default defineComponent({
  name: 'CryptoPage',
  setup() {
    const store = useMainStore()
    const { plan } = usePlanParams()
    const { currency } = useCurrencyParams()
    const { subscriptionId } = useSubscriptionIdParam()
    const error = ref('')
    const currentState = ref<StepType | IdleStep>('idle')
    const loading = ref(false)
    const data = ref<CryptoPayment | null>(null)
    const router = useRouter()

    onMounted(async () => {
      const selectedPlan = get(plan)
      const selectedCurrency = get(currency)
      if (selectedPlan > 0 && selectedCurrency) {
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
        }
      } else if (state === 'pending') {
        return {
          type: 'pending',
          title: 'Payment in Progress',
          message: 'Please wait for your transaction...',
        }
      } else if (state === 'success') {
        return {
          type: 'success',
          title: 'Transaction Done',
          message:
            'You should receive an e-mail confirming the activation of your subscription in the near future.',
        }
      } else {
        return { type: 'idle' }
      }
    })

    return {
      isBtc,
      data,
      step,
      plan,
      loading,
      error,
      currentState,
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
