<script setup lang="ts">
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import CryptoPayment from '~/modules/checkout/components/crypto/CryptoPayment.vue';
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
  <CryptoPayment />
</template>
