<template>
  <div :class="$style.content">
    <checkout-title>Payment Method</checkout-title>
    <checkout-description>
      Please select one of the following payment methods.
    </checkout-description>
    <div :class="$style.methods">
      <payment-method-item
        v-for="item in paymentMethods"
        :key="item.id"
        :selected="isSelected(item.id)"
        @click="select(item.id)"
      >
        <component :is="item.component" />
        <template #label> {{ item.label }} </template>
      </payment-method-item>
    </div>
    <div :class="$style.continue">
      <selection-button :disabled="!selected" selected @click="next">
        Continue to Checkout
      </selection-button>
    </div>
    <login-modal v-model="loginRequired" />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  Ref,
  ref,
  useRoute,
  useRouter,
  useStore,
} from '@nuxtjs/composition-api'
import { RootState } from '~/store'
import { assert } from '~/components/utils/assertions'
import CheckoutTitle from '~/components/checkout/common/CheckoutTitle.vue'

enum PaymentMethod {
  ETH = 1,
  BTC = 2,
  DAI = 3,
  CARD = 4,
  PAYPAL = 5,
}

type PaymentMethodItem = {
  id: PaymentMethod
  label: string
  component: string
}

const paymentMethods: PaymentMethodItem[] = [
  {
    id: PaymentMethod.ETH,
    label: 'Ethereum',
    component: 'ethereum-icon',
  },
  {
    id: PaymentMethod.BTC,
    label: 'Bitcoin',
    component: 'bitcoin-icon',
  },
  {
    id: PaymentMethod.DAI,
    label: 'DAI',
    component: 'dai-icon',
  },
  {
    id: PaymentMethod.CARD,
    label: 'Card',
    component: 'card-icon',
  },
  {
    id: PaymentMethod.PAYPAL,
    label: 'Paypal',
    component: 'paypal-icon',
  },
]

export default defineComponent({
  name: 'PaymentMethodSelection',
  components: { CheckoutTitle },
  setup() {
    const selected: Ref<PaymentMethod | null> = ref(null)
    const loginRequired = ref(false)
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const next = () => {
      if (store.state.authenticated) {
        const query: { p: string; c?: string } = {
          p: route.value.query.p as string,
        }
        let path: string
        const value = selected.value
        assert(value)
        if (value === PaymentMethod.CARD) {
          path = '/checkout/pay/card'
        } else if (value === PaymentMethod.PAYPAL) {
          path = '/checkout/pay/paypal'
        } else {
          path = '/checkout/pay/crypto'
          query.c = PaymentMethod[value]
        }

        router.push({
          path,
          query,
        })
      } else {
        loginRequired.value = true
      }
    }

    const isSelected = (method: PaymentMethod) => {
      return selected.value === method
    }

    const select = (method: PaymentMethod) => {
      selected.value = method
    }

    return {
      paymentMethods,
      method: PaymentMethod,
      loginRequired,
      next,
      selected,
      select,
      isSelected,
    }
  },
})
</script>

<style lang="scss" module>
$text-color: #212529;

.content {
  padding: 0;
}

.methods {
  @apply flex flex-row;

  > * {
    margin-left: 23px;
    margin-right: 23px;
  }
}

.continue {
  @apply flex flex-row justify-center mt-9;

  & > button {
    width: 187px;
  }
}
</style>
