<script setup lang="ts">
import type { CheckoutStepId } from '@rotki/checkout-ui/utils/checkout-flow';
import CheckoutShell from '@rotki/checkout-ui/components/CheckoutShell.vue';
import { get } from '@vueuse/shared';
import {
  useDiscountCodeParams,
  usePlanIdParam,
  useReferralCodeParam,
  useSubscriptionIdParam,
} from '~/modules/checkout/composables/use-plan-params';
import { buildQueryParams } from '~/utils/query';

defineSlots<{
  default: () => void;
}>();

/** Pages that offer the way back to the plans. 3D Secure, a created crypto payment and the success page do not. */
const PAGES_WITH_BACK_LINK = new Set<string>([
  'checkout-pay-method',
  'checkout-pay-paypal',
  'checkout-pay-request-crypto',
]);

const route = useRoute();
const router = useRouter();

const { planId } = usePlanIdParam();
const { referralCode } = useReferralCodeParam();
const { discountCode } = useDiscountCodeParams();
const { subscriptionId, upgradeSubId } = useSubscriptionIdParam();

const step = computed<CheckoutStepId>(() => (route.name === 'checkout-success' ? 'confirmation' : 'payment'));

/**
 * The plan step with the buyer's params, on pages that offer it. An upgrade starts from the
 * subscription page and a renewal from its e-mail, so neither gets one.
 */
function plansHref(): string | undefined {
  if (get(upgradeSubId) || get(subscriptionId) || typeof route.name !== 'string' || !PAGES_WITH_BACK_LINK.has(route.name))
    return undefined;

  return router.resolve({
    name: 'checkout-pay',
    query: buildQueryParams({
      discountCode: get(discountCode),
      planId: get(planId),
      ref: get(referralCode),
    }),
  }).href;
}

const backHref = computed<string | undefined>(() => plansHref());
</script>

<template>
  <CheckoutShell
    :step="step"
    :back-href="backHref"
    home-href="/"
    logo-src="/img/logo-small.svg"
  >
    <slot />
  </CheckoutShell>
</template>
