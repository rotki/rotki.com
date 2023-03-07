<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

useHead({
  title: 'account activation | rotki',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: '',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
</script>

<template>
  <PendingActivation />
</template>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
