<script setup lang="ts">
import PasswordReset from '~/components/account/password/PasswordReset.vue';
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: 'maintenance',
});

useHead({
  title: 'password rest',
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
