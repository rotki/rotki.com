<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: [
    'maintenance',
    'authentication',
    'unverified',
    'subscriber',
    'csp',
    'valid-plan-id',
  ],
});

useHead({
  title: 'pay with paypal',
  meta: [
    {
      key: 'description',
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
