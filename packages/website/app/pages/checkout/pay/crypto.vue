<script setup lang="ts">
import { definePageMeta } from '#app/composables/pages';
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import CryptoPayment from '~/modules/checkout/components/crypto/CryptoPayment.vue';

definePageMeta({
  auth: true,
  layout: 'checkout',
  middleware: ['valid-plan-id'],
  requiresSubscriber: true,
  requiresVerified: true,
});

usePageSeoNoIndex('pay with crypto');

useAutoLogout();
</script>

<template>
  <CryptoPayment />
</template>
