<script lang="ts" setup>
import { get } from '@vueuse/core';
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: ['maintenance', 'unverified', 'pending-payment', 'subscriber'],
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

const { plan } = usePlanParams();
const { subscriptionId } = useSubscriptionIdParam();

onBeforeMount(() => {
  if (!get(plan)) {
    navigateTo({ name: 'checkout-pay' });
  }
});
</script>

<template>
  <PaymentMethodSelection :identifier="subscriptionId" />
</template>
