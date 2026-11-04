<script lang="ts" setup>
import MethodTiles from '@rotki/checkout-ui/components/MethodTiles.vue';
import { buildMethodLinks, type CheckoutMethodId, type MethodLinks } from '@rotki/checkout-ui/utils/checkout-flow';
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

// The renewal e-mail renews a crypto subscription, so its own payment page offers no switch.
const isRenewal = computed<boolean>(() => !!get(subscriptionId));

const links = computed<MethodLinks>(() => buildMethodLinks({
  // Only an explicit code is forwarded: each payment page falls back to referral, then campaign.
  params: { discountCode: get(discountCode), id: get(subscriptionId), planId: get(planId), ref: get(referralCode) },
  braintreeUnavailable: !get(braintreePaymentEnabled),
}));

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
