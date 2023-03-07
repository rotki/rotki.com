<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: ['maintenance', 'authentication', 'subscriber'],
});

useHead({
  title: 'pay with crypto | rotki',
  meta: [
    {
      key: 'description',
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
  <CryptoPage />
</template>
