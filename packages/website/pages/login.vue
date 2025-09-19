<script setup lang="ts">
import { commonAttrs } from '~/utils/metadata';

definePageMeta({
  middleware: ['maintenance', 'authenticated'],
});

useHead({
  title: 'login',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Manage your rotki premium account',
    },
  ],
  ...commonAttrs(),
});
</script>

<template>
  <LoginPage />
</template>
