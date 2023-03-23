<script setup lang="ts">
import { get } from '@vueuse/core';
import { type Component, type Ref } from 'vue';
import { storeToRefs } from 'pinia';
import {
  BitcoinIcon,
  CardIcon,
  DaiIcon,
  EthereumIcon,
  PaypalIcon,
} from '#components';
import { useMainStore } from '~/store';
import { assert } from '~/utils/assert';

enum PaymentMethod {
  ETH = 1,
  BTC = 2,
  DAI = 3,
  CARD = 4,
  PAYPAL = 5,
}

type PaymentMethodItem = {
  id: PaymentMethod;
  label: string;
  component: Component;
  crypto?: true;
};

const paymentMethods: PaymentMethodItem[] = [
  {
    id: PaymentMethod.ETH,
    label: 'Ethereum',
    component: EthereumIcon,
    crypto: true,
  },
  {
    id: PaymentMethod.BTC,
    label: 'Bitcoin',
    component: BitcoinIcon,
    crypto: true,
  },
  {
    id: PaymentMethod.DAI,
    label: 'DAI',
    component: DaiIcon,
    crypto: true,
  },
  {
    id: PaymentMethod.CARD,
    label: 'Card',
    component: CardIcon,
  },
  {
    id: PaymentMethod.PAYPAL,
    label: 'Paypal',
    component: PaypalIcon,
  },
];

const props = defineProps<{ identifier?: string }>();

const { identifier } = toRefs(props);
const selected: Ref<PaymentMethod | null> = ref(null);
const loginRequired = ref(false);
const store = useMainStore();
const route = useRoute();

const { authenticated } = storeToRefs(store);

const proceed = async () => {
  if (authenticated.value) {
    const query: { p: string; c?: string; id?: string } = {
      p: route.query.p as string,
    };
    let path: string;
    const value = selected.value;
    assert(value);
    if (value === PaymentMethod.CARD) {
      path = '/checkout/pay/card';
    } else if (value === PaymentMethod.PAYPAL) {
      path = '/checkout/pay/paypal';
    } else {
      path = '/checkout/request/crypto';
      query.c = PaymentMethod[value];
    }

    const id = get(identifier);
    if (id) {
      query.id = id;
    }

    await navigateTo({
      path,
      query,
    });
  } else {
    loginRequired.value = true;
  }
};

const isSelected = (method: PaymentMethod) => selected.value === method;

const select = (method: PaymentMethod) => {
  selected.value = method;
};

const availablePaymentMethods = computed(() => {
  if (!get(identifier)) {
    return paymentMethods;
  }
  return paymentMethods.filter((value) => value.crypto);
});

const css = useCssModule();
</script>

<template>
  <div :class="css.content">
    <CheckoutTitle>Payment Methods</CheckoutTitle>
    <CheckoutDescription>
      Please select one of the following payment methods.
    </CheckoutDescription>
    <div :class="css.wrapper">
      <div :class="css.methods">
        <PaymentMethodItem
          v-for="item in availablePaymentMethods"
          :key="item.id"
          :class="css.method"
          :selected="isSelected(item.id)"
          @click="select(item.id)"
        >
          <Component :is="item.component" />
          <template #label> {{ item.label }} </template>
        </PaymentMethodItem>
      </div>
    </div>
    <div :class="css.continue">
      <SelectionButton :disabled="!selected" selected @click="proceed">
        Continue to Checkout
      </SelectionButton>
    </div>
    <LoginModal v-model="loginRequired" />
  </div>
</template>

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
