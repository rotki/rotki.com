<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: 'maintenance',
});

useHead({
  title: 'reset password',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Reset your rotki password',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
</script>

<template>
  <PasswordReset />
</template>
