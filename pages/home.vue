<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: ['maintenance', 'authentication'],
});

useHead({
  title: 'account',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Manage your rotki premium account',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

useAutoLogout();
</script>

<template>
  <AccountOverview />
</template>

<style lang="scss">
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';
</style>
