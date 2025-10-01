<script setup lang="ts">
import CryptoPaymentContainer from '~/components/checkout/pay/crypto/payment/CryptoPaymentContainer.vue';
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: [
    'maintenance',
    'authentication',
    'unverified',
    'subscriber-or-upgrade',
    'valid-plan-id',
  ],
});

useHead({
  title: 'pay with crypto',
  meta: [
    {
      name: 'description',
      content: 'Pay with Crypto for your rotki premium subscription',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

useAutoLogout();
</script>

<template>
  <CryptoPaymentContainer />
</template>
