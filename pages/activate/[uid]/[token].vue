<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: 'maintenance',
});

useHead({
  title: 'activate account',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Activate your new account',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
</script>

<template>
  <AccountActivate />
</template>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
