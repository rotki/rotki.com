<script setup lang="ts">
import PasswordChanged from '~/components/account/password/PasswordChanged.vue';
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
