<template>
  <page wide>
    <div :class="$style.content">
      <checkout-title>Payment Details</checkout-title>

      <checkout-description>
        <div :class="$style.description">
          <span :class="$style.text">Payments are safely processed with</span>
          <braintree-icon :class="$style.braintree" />
        </div>
      </checkout-description>
      <loader v-if="!token" :class="$style.loader" />
      <card-payment v-else :plan="plan" :token="token" @pay="submit($event)" />
    </div>
  </page>
</template>

<script lang="ts">
import {
  computed,
  defineComponent,
  useAsync,
  useRoute,
} from '@nuxtjs/composition-api'
import { useMainStore } from '~/store'
import { CardCheckout, Result, SelectedPlan } from '~/types'

export default defineComponent({
  name: 'CardPage',
  setup() {
    const store = useMainStore()
    const route = useRoute()

    const checkout = useAsync<Result<CardCheckout>>(() => {
      // TODO properly check and navigate way on invalid plan
      return store.checkout(parseInt(route.value.query.p as string))
    })
    const plan = computed<SelectedPlan | null>(() => {
      const payload = checkout.value
      if (!payload || payload.isError) {
        return null
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { braintreeClientToken, ...data } = payload.result
      return data
    })

    const token = computed(() => {
      const payload = checkout.value
      if (!payload || payload.isError) {
        return ''
      }
      return payload.result.braintreeClientToken
    })

    const submit = async ({
      months,
      nonce,
    }: {
      months: number
      nonce: string
    }) => {
      await store.pay({
        months,
        paymentMethodNonce: nonce,
      })
    }
    return {
      plan,
      token,
      submit,
    }
  },
})
</script>

<style lang="scss" module>
.content {
  padding: 0;
}

.card {
  @apply absolute top-3.5 right-2;

  width: 24px;
  height: 24px;
}

.braintree {
  @apply ml-1;

  width: 120px;
}

.text {
  @apply pt-0.5;
}

.description {
  @apply flex flex-row;
}

.loader {
  min-height: 400px;
}
</style>
