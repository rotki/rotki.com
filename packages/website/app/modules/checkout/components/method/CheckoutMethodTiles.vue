<script lang="ts" setup>
import type { CheckoutMethodId, MethodLinks } from '@rotki/checkout-ui/utils/checkout-flow';
import MethodTiles from '@rotki/checkout-ui/components/MethodTiles.vue';
import { SigilEvents } from '@rotki/sigil';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import {
  useDiscountCodeParams,
  usePlanIdParam,
  useReferralCodeParam,
  useSubscriptionIdParam,
} from '~/modules/checkout/composables/use-plan-params';
import { useMainStore } from '~/store';
import { buildQueryParams } from '~/utils/query';

const { current } = defineProps<{
  /** The method of the page the tiles are on; left out on the method page. */
  current?: CheckoutMethodId;
}>();

const store = useMainStore();
const { braintreePaymentEnabled } = storeToRefs(store);

const { planId } = usePlanIdParam();
const { referralCode } = useReferralCodeParam();
const { discountCode } = useDiscountCodeParams();
// An upgrade keeps the subscription's payment method, so it gets no tiles.
const { subscriptionId, upgradeSubId } = useSubscriptionIdParam();

const { chronicle } = useSigilEvents();

const query = computed<string>(() => new URLSearchParams(buildQueryParams({
  // Only an explicit code is forwarded: each payment page falls back to referral, then campaign.
  discountCode: get(discountCode),
  // The subscription a crypto renewal e-mail links to.
  id: get(subscriptionId),
  planId: get(planId),
  ref: get(referralCode),
})).toString());

/*
 * Plain links, so every switch is a full page load: the card page is a separate app and
 * the PayPal page needs its own CSP.
 */
// The renewal e-mail renews a crypto subscription, which only a crypto payment can pay.
const isRenewal = computed<boolean>(() => !!get(subscriptionId));

const links = computed<MethodLinks>(() => {
  const search = get(query) ? `?${get(query)}` : '';
  if (get(isRenewal))
    return { crypto: { href: `/checkout/pay/request-crypto${search}` } };

  const braintreeUnavailable = !get(braintreePaymentEnabled);
  return {
    card: { disabled: braintreeUnavailable, href: `/checkout/pay/card${search}` },
    crypto: { href: `/checkout/pay/request-crypto${search}` },
    paypal: { disabled: braintreeUnavailable, href: `/checkout/pay/paypal${search}` },
  };
});

// Payment pages can be opened directly, so the tiles check Braintree themselves; the store dedupes the request.
onMounted(async () => {
  await store.fetchBraintreePaymentAvailability();
});

function trackSelection(method: CheckoutMethodId): void {
  if (method === current)
    return;

  chronicle(SigilEvents.CHECKOUT_METHOD_SELECTED, {
    method,
    planId: get(planId),
  });
}
</script>

<template>
  <MethodTiles
    v-if="!upgradeSubId && !(isRenewal && current)"
    :links="links"
    :current="current"
    @select="trackSelection($event)"
  />
</template>
