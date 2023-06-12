<script setup lang="ts">
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
</script>

<template>
  <PaymentMethodPage />
</template>
