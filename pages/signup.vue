<script setup lang="ts">
import { commonAttrs } from '~/utils/metadata';

definePageMeta({
  middleware: 'maintenance',
});

useHead({
  title: 'signup',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Create a new rotki premium account',
    },
  ],
  ...commonAttrs(),
});
</script>

<template>
  <SignupForm />
</template>

<style lang="scss">
@import '@/assets/css/main.scss';
</style>
