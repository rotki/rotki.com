<script lang="ts" setup>
import { monthsToPlanDuration, SigilEvents } from '@rotki/sigil';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';
import { useSubscriptionIdParam } from '~/modules/checkout/composables/use-plan-params';
import { useMainStore } from '~/store';

/*
 * The start of the payment step, kept as an address because pricing buttons, sign-in redirects
 * and the crypto renewal e-mail link here. It runs the checkout checks, then opens a payment
 * page, where the method tiles switch methods.
 */
definePageMeta({
  auth: true,
  layout: 'checkout',
  middleware: ['pending-payment', 'valid-plan-id'],
  requiresSubscriber: true,
  requiresVerified: true,
});

usePageSeoNoIndex('select payment method');

const route = useRoute();
const router = useRouter();

const store = useMainStore();
const { braintreePaymentEnabled } = storeToRefs(store);

const { chronicle } = useSigilEvents();
const checkout = useCheckout();
const { subscriptionId } = useSubscriptionIdParam();

await store.fetchBraintreePaymentAvailability();

/** A renewal is paid in crypto; otherwise card first, crypto while Braintree is down. */
function paymentPagePath(): string {
  if (get(subscriptionId) || !get(braintreePaymentEnabled))
    return '/checkout/pay/request-crypto';
  return '/checkout/pay/card';
}

onMounted(async () => {
  const plan = get(checkout.selectedPlan);
  const breakdownData = get(checkout.breakdown);
  const discountInfo = breakdownData?.discount;
  let discountType: 'discount' | 'referral' | undefined;
  if (discountInfo?.isValid === true) {
    discountType = discountInfo.isReferral ? 'referral' : 'discount';
  }

  chronicle(SigilEvents.CHECKOUT_START, {
    planId: get(checkout.planId),
    planName: plan?.name,
    planDuration: monthsToPlanDuration(plan?.durationInMonths),
    amount: breakdownData?.finalAmount,
    isUpgrade: get(checkout.isUpgrade),
    discount: discountType,
  });

  // Replaced, so the browser's back button skips this page. The card page is a separate app, hence the full load.
  const path = paymentPagePath();
  const { href } = router.resolve({ path, query: route.query });
  await navigateTo(href, { external: path === '/checkout/pay/card', replace: true });
});
</script>

<template>
  <div
    class="grow"
    data-cy="checkout-method-redirect"
  />
</template>
