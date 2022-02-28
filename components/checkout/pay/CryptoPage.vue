<template>
  <payment-frame :loading="loading">
    <template #description>
      <div :class="$style.description">
        To finish purchasing your subscription you must send the specified
        amount to the listed address. After the transaction, you will be
        notified about the activation of your subscription via e-mail.
      </div>
    </template>
    <error-display
      v-if="error"
      :message="error"
      title="Crypto Payment Failed"
    />
    <crypto-payment-form v-else-if="data" :data="data" :plan="plan" />
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
import { CryptoPayment } from '~/types'
import {
  setupCurrencyParams,
  setupPlanParams,
  useSubscriptionIdParam,
} from '~/composables/plan'
import { useMainStore } from '~/store'

export default defineComponent({
  name: 'CryptoPage',
  middleware: [],
  setup() {
    const store = useMainStore()
    const { plan } = setupPlanParams()
    const { currency } = setupCurrencyParams()
    const { subscriptionId } = useSubscriptionIdParam()
    const error = ref('')
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

    return {
      isBtc,
      data,
      plan,
      error,
      loading,
    }
  },
})
</script>

<style lang="scss" module>
.description {
  max-width: 600px;
}
</style>
