<script setup lang="ts">
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import CryptoRequest from '~/modules/checkout/components/crypto/CryptoRequest.vue';

definePageMeta({
  auth: true,
  middleware: ['pending-payment', 'valid-plan-id'],
  requiresSubscriber: true,
  requiresVerified: true,
});

usePageSeoNoIndex('pay with crypto');
useAutoLogout();
</script>

<template>
  <CryptoRequest />
</template>
