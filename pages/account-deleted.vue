<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

useHead({
  title: 'account deleted',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Your account has been successfully deleted',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
</script>

<template>
  <AccountDeletedPage />
</template>

<style lang="scss">
@use '@/assets/css/media';
@use '@/assets/css/main';
</style>
