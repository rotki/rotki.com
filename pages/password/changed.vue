<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: 'maintenance',
});

useHead({
  title: 'password changed',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'The rotki account password changed with success',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
</script>

<template>
  <PasswordChanged />
</template>
