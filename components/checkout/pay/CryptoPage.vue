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
    <crypto-payment-form v-if="data" :data="data" />
  </payment-frame>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
} from '@nuxtjs/composition-api'
import { CryptoPayment } from '~/types'
import { setupCurrencyParams, setupPlanParams } from '~/composables/plan'
import { useMainStore } from '~/store'

export default defineComponent({
  name: 'CryptoPage',
  setup() {
    const store = useMainStore()
    const { plan } = setupPlanParams()
    const { currency } = setupCurrencyParams()
    const error = ref('')
    const loading = ref(false)
    const data = ref<CryptoPayment | null>(null)

    onMounted(async () => {
      if (plan.value > 0 && currency.value) {
        loading.value = true
        const result = await store.cryptoPayment(plan.value, currency.value)
        if (result.isError) {
          error.value = result.error.message
        }
        loading.value = false
      } else {
        // todo invalid plan
      }
    })

    const isBtc = computed(() => data.value?.cryptocurrency === 'BTC')

    return {
      isBtc,
      data,
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
