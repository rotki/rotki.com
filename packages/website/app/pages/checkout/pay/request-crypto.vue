<script setup lang="ts">
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import CryptoRequest from '~/modules/checkout/components/crypto/CryptoRequest.vue';
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
