<template>
  <page :center-vertically="false">
    <template #title>Crypto Payment</template>
    <page-content>
      <div :class="$style.content">
        <checkout-title>Payment Details</checkout-title>
        <div>Payments by crypto can have slower processing times.</div>
        <crypto-payment-info />
        <selected-plan-overview :plan="selectedPlan" crypto />
        <accept-refund-policy
          v-model="acceptRefundPolicy"
          :class="$style.policy"
        />
        <selection-button
          :class="$style.button"
          :disabled="!acceptRefundPolicy"
          selected
          @click="submit"
        >
          Submit Request
        </selection-button>
      </div>
    </page-content>
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  onMounted,
  ref,
  useRouter,
} from '@nuxtjs/composition-api'
import { get, toRefs, useTimestamp } from '@vueuse/core'
import {
  useCurrencyParams,
  usePlanParams,
  useSubscriptionIdParam,
} from '~/composables/plan'
import { SelectedPlan } from '~/types'
import { useMainStore } from '~/store'

export default defineComponent({
  name: 'CryptoRequestPage',
  setup() {
    const store = useMainStore()
    const { account, plans } = toRefs(store)
    const acceptRefundPolicy = ref(false)
    const { plan } = usePlanParams()
    const { currency } = useCurrencyParams()
    const { subscriptionId } = useSubscriptionIdParam()
    const selectedPlan = computed<SelectedPlan>(() => {
      const availablePlans = get(plans)
      const months = get(plan)
      const selectedPlan = availablePlans?.find(
        (plan) => plan.months === months
      )
      return {
        startDate: get(useTimestamp()) / 1000,
        finalPriceInEur: selectedPlan?.priceCrypto ?? '0',
        priceInEur: selectedPlan?.priceCrypto ?? '0',
        months,
        vat: get(account)?.vat || 0,
      }
    })

    const router = useRouter()

    const submit = () => {
      router.push({
        path: '/checkout/pay/crypto',
        query: {
          p: get(plan).toString(),
          c: get(currency),
          id: get(subscriptionId),
        },
      })
    }

    onMounted(async () => await store.getPlans())

    return {
      plan,
      selectedPlan,
      acceptRefundPolicy,
      submit,
    }
  },
})
</script>

<style lang="scss" module>
@import '~assets/css/media';

.content {
  padding: 0;
}

.description {
  max-width: 600px;

  @include text-size(18px, 21px);
}

.button {
  @apply mt-10;
}

.policy {
  @apply mt-8;
}
</style>
