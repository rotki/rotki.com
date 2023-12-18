<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import { type Component, type ComputedRef, type Ref } from 'vue';
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

const props = defineProps<{ identifier?: string }>();

const { t } = useI18n();

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
  name: string;
};

const store = useMainStore();
const css = useCssModule();
const { plan } = usePlanParams();
const { isSupportedCrypto } = useCurrencyParams();
const { paymentMethodId } = usePaymentMethodParam();

const { identifier } = toRefs(props);
const { authenticated } = storeToRefs(store);

const loginRequired = ref(false);
const method: Ref<PaymentMethod | undefined> = ref(get(paymentMethodId));
const processing: Ref<boolean> = ref(false);

const availablePaymentMethods = computed(() => {
  if (!get(identifier)) {
    return paymentMethods;
  }
  return paymentMethods.filter((value) =>
    isSupportedCrypto(PaymentMethod[value.id]),
  );
});

const selected: ComputedRef<PaymentMethodItem | undefined> = computed(() =>
  get(availablePaymentMethods).find((m) => get(method) === m.id),
);

const paymentMethods: PaymentMethodItem[] = [
  {
    id: PaymentMethod.ETH,
    label: 'Ethereum',
    component: EthereumIcon,
    name: 'checkout-pay-request-crypto',
  },
  {
    id: PaymentMethod.BTC,
    label: 'Bitcoin',
    component: BitcoinIcon,
    name: 'checkout-pay-request-crypto',
  },
  {
    id: PaymentMethod.DAI,
    label: 'DAI',
    component: DaiIcon,
    name: 'checkout-pay-request-crypto',
  },
  {
    id: PaymentMethod.CARD,
    label: 'Card',
    component: CardIcon,
    name: 'checkout-pay-card',
  },
  {
    id: PaymentMethod.PAYPAL,
    label: 'Paypal',
    component: PaypalIcon,
    name: 'checkout-pay-paypal',
  },
];

const back = async () => {
  await navigateTo({
    name: 'checkout-pay',
    query: { plan: get(plan), method: get(selected) ? get(method) : undefined },
  });
};

const next = async () => {
  if (get(authenticated)) {
    set(processing, true);
    const selectedMethod = get(selected);
    assert(selectedMethod);
    const { name, id } = selectedMethod;

    if (selectedMethod.id === PaymentMethod.CARD) {
      // For card payments we use href instead of router to trigger a server reload
      // This need to happen due to the CSP policy required for 3DSecure v2
      const queryString = new URLSearchParams({
        plan: get(plan).toString(),
        id: get(identifier) ?? '',
        method: selectedMethod.id.toString(),
      });
      const url = new URL(
        `${window.location.origin}/checkout/pay/card?${queryString}`,
      );
      window.location.href = url.toString();
    } else {
      await navigateTo({
        name,
        query: {
          plan: get(plan),
          currency: isSupportedCrypto(PaymentMethod[id])
            ? PaymentMethod[id]
            : null,
          id: get(identifier),
          method: id,
        },
      });
    }
  } else {
    set(loginRequired, true);
  }
};

const isSelected = (m: PaymentMethod) => get(method) === m;

const select = (m: PaymentMethod) => {
  set(method, m);
};
</script>

<template>
  <div :class="css.content">
    <CheckoutTitle>{{ t('home.plans.tiers.step_2.title') }}</CheckoutTitle>
    <CheckoutDescription>
      {{ t('home.plans.tiers.step_2.subtitle') }}
    </CheckoutDescription>
    <div :class="css.wrapper">
      <div :class="css.methods">
        <PaymentMethodItem
          v-for="item in availablePaymentMethods"
          :key="item.id"
          :selected="isSelected(item.id)"
          @click="select(item.id)"
        >
          <Component :is="item.component" />
          <template #label> {{ item.label }}</template>
        </PaymentMethodItem>
      </div>
    </div>
    <div :class="css.buttons">
      <RuiButton
        :disabled="processing"
        class="w-full"
        size="lg"
        @click="back()"
      >
        {{ t('actions.back') }}
      </RuiButton>
      <RuiButton
        :disabled="!selected"
        :loading="processing"
        class="w-full"
        color="primary"
        size="lg"
        @click="next()"
      >
        {{ t('actions.continue') }}
      </RuiButton>
    </div>
    <LoginModal v-model="loginRequired" />
  </div>
</template>

<style lang="scss" module>
.content {
  @apply flex flex-col w-full grow;
}

.wrapper {
  @apply w-full justify-center grow my-8;
}

.methods {
  @apply w-full lg:w-auto grid grid-cols-1 sm:grid-cols-2 gap-4 grid-flow-col-dense grid-rows-5 sm:grid-rows-3;
}

.buttons {
  @apply flex gap-4 justify-center mt-9 w-full max-w-[27.5rem] mx-auto;
}
</style>
