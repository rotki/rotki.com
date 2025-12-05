<script setup lang="ts">
import CryptoRequest from '~/components/checkout/pay/crypto/request/CryptoRequest.vue';
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: [
    'maintenance',
    'authentication',
    'unverified',
    'subscriber-or-upgrade',
    'pending-payment',
    'valid-plan-id',
  ],
});

useHead({
  title: 'pay with crypto',
  meta: [
    {
      name: 'description',
      content:
        'Create a request to pay with Crypto for your rotki premium subscription',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
useAutoLogout();
</script>

<template>
  <CryptoRequest />
</template>
