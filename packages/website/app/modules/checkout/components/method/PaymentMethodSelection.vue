<script lang="ts" setup>
import type { RuiIcons } from '@rotki/ui-library';
import { get, isDefined, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import CheckoutDescription from '~/modules/checkout/components/common/CheckoutDescription.vue';
import CheckoutTitle from '~/modules/checkout/components/common/CheckoutTitle.vue';
import PaymentMethodItem from '~/modules/checkout/components/method/PaymentMethodItem.vue';
import { usePlanIdParam, useReferralCodeParam } from '~/modules/checkout/composables/use-plan-params';
import { useMainStore } from '~/store';
import { PaymentMethod } from '~/types/payment';

import { assert } from '~/utils/assert';
import { navigateToWithCSPSupport } from '~/utils/navigation';
import { buildQueryParams } from '~/utils/query';

interface PaymentMethodEntry {
  id: PaymentMethod;
  label: string;
  icon: RuiIcons;
  name: string;
  class: string;
}

interface RouteMap {
  [key: string]: string;
}

const props = defineProps<{
  identifier?: string;
}>();
const { planId } = usePlanIdParam();
const { referralCode } = useReferralCodeParam();
const { t } = useI18n({ useScope: 'global' });
const router = useRouter();

const { identifier } = toRefs(props);
const selectedMethod = ref<PaymentMethod>();
const processing = ref<boolean>(false);

const store = useMainStore();
const { authenticated } = storeToRefs(store);
const { chronicle } = useSigilEvents();

const paymentMethods: readonly PaymentMethodEntry[] = Object.freeze([{
  id: PaymentMethod.BLOCKCHAIN,
  label: 'Blockchain',
  icon: 'lu-blockchain' as RuiIcons,
  name: 'checkout-pay-request-crypto',
  class: 'sm:col-start-1',
}, {
  id: PaymentMethod.CARD,
  label: 'Card',
  icon: 'lu-credit-card' as RuiIcons,
  name: 'checkout-pay-card',
  class: 'sm:col-start-2',
}, {
  id: PaymentMethod.PAYPAL,
  label: 'Paypal',
  icon: 'lu-paypal' as RuiIcons,
  name: 'checkout-pay-paypal',
  class: 'sm:col-start-2',
}]);

const routeMap: RouteMap = {
  'checkout-pay-card': '/checkout/pay/card',
  'checkout-pay-crypto': '/checkout/pay/crypto',
  'checkout-pay-paypal': '/checkout/pay/paypal',
  'checkout-pay-request-crypto': '/checkout/pay/request-crypto',
};

const selectedPaymentMethod = computed<PaymentMethodEntry | undefined>(() =>
  paymentMethods.find(({ id }) => get(selectedMethod) === id),
);

const isMethodSelected = computed<(method: PaymentMethod) => boolean>(
  () => (method: PaymentMethod) => get(selectedMethod) === method,
);

const queryParams = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {};
  const selectedPlanId = get(planId);
  const ref = get(referralCode);

  if (selectedPlanId) {
    result.planId = String(selectedPlanId);
  }

  if (isDefined(identifier)) {
    result.id = get(identifier)!;
  }

  if (ref) {
    result.ref = ref;
  }

  return result;
});

function selectPaymentMethod(method: PaymentMethod): void {
  set(selectedMethod, method);
}

function buildNavigationUrl(routeName: string): string {
  try {
    const resolved = router.resolve({
      name: routeName,
      query: get(queryParams),
    });
    return resolved.href;
  }
  catch (error) {
    console.warn('Router resolve failed, falling back to manual URL construction:', error);
    const basePath = routeMap[routeName] || '/checkout/pay/method';
    const queryString = new URLSearchParams(get(queryParams)).toString();
    return queryString ? `${basePath}?${queryString}` : basePath;
  }
}

async function handleBack(): Promise<void> {
  const query = buildQueryParams({
    planId: get(planId),
    ref: get(referralCode),
  });

  await navigateTo({
    name: 'checkout-pay',
    query,
  });
}

async function handleContinue(): Promise<void> {
  const selected = get(selectedPaymentMethod);
  assert(selected, 'No payment method selected');

  // Track payment method selection
  chronicle('checkout_method_selected', {
    method: get(selectedMethod),
    plan_id: get(planId),
  });

  set(processing, true);

  try {
    const href = buildNavigationUrl(selected.name);

    if (get(authenticated)) {
      await navigateToWithCSPSupport(href);
    }
    else {
      await navigateTo({
        path: '/login',
        query: {
          redirectUrl: encodeURIComponent(href),
        },
      });
    }
  }
  catch (error) {
    console.error('Navigation failed:', error);
  }
  finally {
    set(processing, false);
  }
}
</script>

<template>
  <div class="flex flex-col w-full grow">
    <CheckoutTitle>{{ t('home.plans.tiers.step_2.title') }}</CheckoutTitle>
    <CheckoutDescription>
      {{ t('home.plans.tiers.step_2.subtitle') }}
    </CheckoutDescription>
    <div class="w-full justify-center grow my-6">
      <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PaymentMethodItem
          v-for="item in paymentMethods"
          :key="item.id"
          :selected="isMethodSelected(item.id)"
          :class="item.class"
          @click="selectPaymentMethod(item.id)"
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
    <div class="flex gap-4 justify-center mt-6 w-full max-w-[27.5rem] mx-auto">
      <RuiButton
        :disabled="processing"
        class="w-full"
        size="lg"
        @click="handleBack()"
      >
        <template #prepend>
          <RuiIcon
            name="lu-arrow-left"
            size="16"
          />
        </template>
        {{ t('actions.back') }}
      </RuiButton>
      <RuiButton
        :disabled="!selectedPaymentMethod"
        :loading="processing"
        class="w-full"
        color="primary"
        size="lg"
        @click="handleContinue()"
      >
        {{ t('actions.continue') }}
      </RuiButton>
    </div>
  </div>
</template>
