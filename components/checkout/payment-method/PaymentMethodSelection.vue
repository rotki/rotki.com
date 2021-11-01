<template>
  <div :class="$style.content">
    <div :class="$style.title">Payment Method</div>
    <div :class="$style.description">
      Please select one of the following payment methods.
    </div>
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
      <selection-button selected @click="next">
        Continue to Checkout
      </selection-button>
    </div>
    <login-modal v-if="loginRequired" @dismiss="loginRequired = false" />
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  useRoute,
  useRouter,
  useStore,
} from '@nuxtjs/composition-api'
import { RootState } from '~/store'

enum PaymentMethod {
  ETH,
  BTC,
  DAI,
  CARD,
  PAYPAL,
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
  setup() {
    const loginRequired = ref(false)
    const store = useStore<RootState>()
    const router = useRouter()
    const route = useRoute()

    const next = () => {
      if (store.state.authenticated) {
        router.push({
          path: '',
          query: {
            p: route.value.query.p,
          },
        })
      } else {
        loginRequired.value = true
      }
    }
    const selected = ref(PaymentMethod.ETH)

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

.text {
  letter-spacing: 0;
}

.title {
  line-height: 33px;
  font-size: 28px;
  margin-bottom: 16px;

  @extend .text;
}

.description {
  line-height: 18px;
  font-size: 15px;
  margin-bottom: 56px;

  @extend .text;
}
</style>
