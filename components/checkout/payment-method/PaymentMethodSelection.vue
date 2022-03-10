<template>
  <div :class="$style.content">
    <checkout-title>Payment Method</checkout-title>
    <checkout-description>
      Please select one of the following payment methods.
    </checkout-description>
    <div :class="$style.wrapper">
      <div :class="$style.methods">
        <payment-method-item
          v-for="item in paymentMethods"
          :key="item.id"
          :class="$style.method"
          :selected="isSelected(item.id)"
          @click="select(item.id)"
        >
          <component :is="item.component" />
          <template #label> {{ item.label }} </template>
        </payment-method-item>
      </div>
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
  computed,
  defineComponent,
  Ref,
  ref,
  toRefs,
  useRoute,
  useRouter,
} from '@nuxtjs/composition-api'
import { get } from '@vueuse/core'
import CheckoutTitle from '~/components/checkout/common/CheckoutTitle.vue'
import { useMainStore } from '~/store'
import { assert } from '~/utils/assert'

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
  crypto?: true
}

const paymentMethods: PaymentMethodItem[] = [
  {
    id: PaymentMethod.ETH,
    label: 'Ethereum',
    component: 'ethereum-icon',
    crypto: true,
  },
  {
    id: PaymentMethod.BTC,
    label: 'Bitcoin',
    component: 'bitcoin-icon',
    crypto: true,
  },
  {
    id: PaymentMethod.DAI,
    label: 'DAI',
    component: 'dai-icon',
    crypto: true,
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
  props: {
    identifier: { required: false, type: String, default: undefined },
  },
  setup(props) {
    const { identifier } = toRefs(props)
    const selected: Ref<PaymentMethod | null> = ref(null)
    const loginRequired = ref(false)
    const store = useMainStore()
    const router = useRouter()
    const route = useRoute()

    // pinia#852
    const { authenticated } = toRefs(store)

    const next = () => {
      if (authenticated.value) {
        const query: { p: string; c?: string; id?: string } = {
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
          path = '/checkout/request/crypto'
          query.c = PaymentMethod[value]
        }

        const id = get(identifier)
        if (id) {
          query.id = id
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

    const availablePaymentMethods = computed(() => {
      if (!get(identifier)) {
        return paymentMethods
      }
      return paymentMethods.filter((value) => value.crypto)
    })

    return {
      paymentMethods: availablePaymentMethods,
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
  @apply w-full;
}

.wrapper {
  @apply flex flex-row w-full justify-center;
}

.methods {
  @apply flex flex-row max-w-full overflow-x-auto;
}

.method {
  @apply mx-4;
}

.continue {
  @apply flex flex-row justify-center mt-9;

  & > button {
    width: 187px;
  }
}
</style>
