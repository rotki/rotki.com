<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: [
    'maintenance',
    'authentication',
    'unverified',
    'subscriber',
    'csp',
  ],
});

useHead({
  title: 'pay with credit card',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Pay with Credit Card for your rotki premium subscription',
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
  <CardPage />
</template>
