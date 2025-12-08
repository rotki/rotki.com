<script setup lang="ts">
import PaypalPage from '~/components/checkout/pay/PaypalPage.vue';
import { useAutoLogout } from '~/composables/account/use-auto-logout';
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
  title: 'pay with paypal',
  meta: [
    {
      name: 'description',
      content: 'Pay with Paypal for your rotki premium subscription',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

useAutoLogout();

onBeforeRouteLeave((to, _from, next) => {
  next(false);
  window.location.href = to.fullPath;
});
</script>

<template>
  <PaypalPage />
</template>
