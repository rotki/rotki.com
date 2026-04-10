<script lang="ts" setup>
import { monthsToPlanDuration, SigilEvents } from '@rotki/sigil';
import { get } from '@vueuse/shared';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import PaymentMethodSelection from '~/modules/checkout/components/method/PaymentMethodSelection.vue';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';
import { useSubscriptionIdParam } from '~/modules/checkout/composables/use-plan-params';

definePageMeta({
  auth: true,
  middleware: ['pending-payment', 'valid-plan-id'],
  requiresSubscriber: true,
  requiresVerified: true,
});

usePageSeoNoIndex('select payment method');

const { subscriptionId } = useSubscriptionIdParam();

// Track checkout start
const { chronicle } = useSigilEvents();
const checkout = useCheckout();

onMounted(() => {
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
});
</script>

<template>
  <PaymentMethodSelection :identifier="subscriptionId" />
</template>
