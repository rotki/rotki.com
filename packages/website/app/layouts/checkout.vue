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

/** An upgrade starts from the subscription page and a renewal from its e-mail, so both lead back to the subscription. */
const fromSubscription = computed<boolean>(() => !!get(upgradeSubId) || !!get(subscriptionId));

/** The way back on pages that offer one: the subscription, or the plan step with the buyer's params. */
function backHrefFor(): string | undefined {
  if (typeof route.name !== 'string' || !PAGES_WITH_BACK_LINK.has(route.name))
    return undefined;
  if (get(fromSubscription))
    return router.resolve({ name: 'home-subscription' }).href;

  return router.resolve({
    name: 'checkout-pay',
    query: buildQueryParams({
      discountCode: get(discountCode),
      planId: get(planId),
      ref: get(referralCode),
    }),
  }).href;
}

const backHref = computed<string | undefined>(() => backHrefFor());
</script>

<template>
  <CheckoutShell
    :step="step"
    :back-href="backHref"
    :back-to="fromSubscription ? 'subscription' : 'plans'"
    home-href="/"
    logo-src="/img/logo-small.svg"
  >
    <slot />
  </CheckoutShell>
</template>
