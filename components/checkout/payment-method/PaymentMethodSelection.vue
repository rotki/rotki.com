<script lang="ts" setup>
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import { PaymentMethod } from '~/types/payment';
import { assert } from '~/utils/assert';
import type { RuiIcons } from '@rotki/ui-library';

const props = defineProps<{ identifier?: string }>();

const { t } = useI18n();

interface PaymentMethodItem {
  id: PaymentMethod;
  label: string;
  icon: RuiIcons;
  name: string;
  class: string;
}

const store = useMainStore();
const css = useCssModule();
const { plan } = usePlanParams();
const { paymentMethodId } = usePaymentMethodParam();

const { identifier } = toRefs(props);
const { authenticated } = storeToRefs(store);

const loginRequired = ref(false);
const method = ref<PaymentMethod>(get(paymentMethodId));
const processing = ref<boolean>(false);

const paymentMethods: PaymentMethodItem[] = [
  {
    id: PaymentMethod.BLOCKCHAIN,
    label: 'Blockchain',
    icon: 'coin-line',
    name: 'checkout-pay-request-crypto',
    class: 'sm:col-start-1',
  },
  {
    id: PaymentMethod.CARD,
    label: 'Card',
    icon: 'bank-card-line',
    name: 'checkout-pay-card',
    class: 'sm:col-start-2',
  },
  {
    id: PaymentMethod.PAYPAL,
    label: 'Paypal',
    icon: 'paypal-line',
    name: 'checkout-pay-paypal',
    class: 'sm:col-start-2',
  },
];

const selected = computed<PaymentMethodItem | undefined>(() =>
  get(paymentMethods).find(m => get(method) === m.id),
);

async function back() {
  await navigateTo({
    name: 'checkout-pay',
    query: { plan: get(plan), method: get(selected) ? get(method) : undefined },
  });
}

async function next() {
  if (get(authenticated)) {
    set(processing, true);
    const selectedMethod = get(selected);
    assert(selectedMethod);
    const { name, id: method } = selectedMethod;

    if (method === PaymentMethod.CARD) {
      // For card payments we use href instead of router to trigger a server reload
      // This need to happen due to the CSP policy required for 3DSecure v2
      const queryString = new URLSearchParams({
        plan: get(plan).toString(),
        id: get(identifier) ?? '',
        method: method.toString(),
      });
      const url = new URL(
        `${window.location.origin}/checkout/pay/card?${queryString}`,
      );
      window.location.href = url.toString();
    }
    else {
      await navigateTo({
        name,
        query: {
          plan: get(plan),
          id: get(identifier),
          method,
        },
      });
    }
  }
  else {
    set(loginRequired, true);
  }
}

const isSelected = (m: PaymentMethod) => get(method) === m;

function select(m: PaymentMethod) {
  set(method, m);
}
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
          v-for="item in paymentMethods"
          :key="item.id"
          :selected="isSelected(item.id)"
          :class="item.class"
          @click="select(item.id)"
        >
          <div class="w-10 h-10 rounded-full bg-rui-grey-400 text-white flex items-center justify-center">
            <RuiIcon :name="item.icon" />
          </div>
          <template #label>
            {{ item.label }}
          </template>
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
  @apply w-full grid grid-cols-1 sm:grid-cols-2 gap-4;
}

.buttons {
  @apply flex gap-4 justify-center mt-9 w-full max-w-[27.5rem] mx-auto;
}
</style>
