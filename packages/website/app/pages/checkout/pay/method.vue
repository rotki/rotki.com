<script lang="ts" setup>
import PaymentMethodSelection from '~/modules/checkout/components/method/PaymentMethodSelection.vue';
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
</script>

<template>
  <PaymentMethodSelection :identifier="subscriptionId" />
</template>
