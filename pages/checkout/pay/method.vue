<script lang="ts" setup>
import { get } from '@vueuse/core';
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
      key: 'description',
      name: 'description',
      content: 'Select how to pay for your rotki premium subscription',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

const { planParams } = usePlanParams();
const { subscriptionId } = useSubscriptionIdParam();

onBeforeMount(() => {
  const planParamsVal = get(planParams);
  if (!planParamsVal)
    navigateTo({ name: 'checkout-pay' });
});
</script>

<template>
  <PaymentMethodSelection :identifier="subscriptionId" />
</template>
