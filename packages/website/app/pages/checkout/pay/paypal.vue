<script setup lang="ts">
import { useAutoLogout } from '~/composables/account/use-auto-logout';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import PaypalPayment from '~/modules/checkout/components/paypal/PaypalPayment.vue';

definePageMeta({
  middleware: [
    'maintenance',
    'authentication',
    'unverified',
    'subscriber-or-upgrade',
    'valid-plan-id',
  ],
});

usePageSeoNoIndex('pay with paypal');

useAutoLogout();

onBeforeRouteLeave((to, _from, next) => {
  next(false);
  window.location.href = to.fullPath;
});
</script>

<template>
  <PaypalPayment />
</template>
