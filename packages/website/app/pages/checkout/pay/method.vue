<script lang="ts" setup>
import { get } from '@vueuse/shared';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';
import PaymentMethodSelection from '~/modules/checkout/components/method/PaymentMethodSelection.vue';
import { useCheckout } from '~/modules/checkout/composables/use-checkout';
import { useSubscriptionIdParam } from '~/modules/checkout/composables/use-plan-params';
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: [
    'maintenance',
    'unverified',
    'pending-payment',
    'subscriber',
    'valid-plan-id',
  ],
});

useHead({
  title: 'select payment method',
  meta: [
    {
      name: 'description',
      content: 'Select how to pay for your rotki premium subscription',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

const { subscriptionId } = useSubscriptionIdParam();

// Track checkout start
const { chronicle } = useSigilEvents();
const checkout = useCheckout();

onMounted(() => {
  const plan = get(checkout.selectedPlan);
  const breakdownData = get(checkout.breakdown);
  const discountInfo = breakdownData?.discount;
  const discountType = discountInfo?.isValid === true
    ? (discountInfo.isReferral ? 'referral' : 'discount')
    : undefined;

  chronicle('checkout_start', {
    plan_id: get(checkout.planId),
    plan_name: plan?.name,
    plan_duration: plan?.durationInMonths === 1 ? 'monthly' : 'yearly',
    amount: breakdownData?.finalAmount,
    is_upgrade: get(checkout.isUpgrade),
    discount: discountType,
  });
});
</script>

<template>
  <PaymentMethodSelection :identifier="subscriptionId" />
</template>
