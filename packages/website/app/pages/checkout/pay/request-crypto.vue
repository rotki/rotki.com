<script setup lang="ts">
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import CryptoRequest from '~/modules/checkout/components/crypto/CryptoRequest.vue';

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

usePageSeoNoIndex('pay with crypto');
useAutoLogout();
</script>

<template>
  <CryptoRequest />
</template>
