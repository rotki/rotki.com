<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: 'maintenance',
});

useHead({
  title: 'recovery e-mail send',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'The password recovery link has been sent to your address',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
</script>

<template>
  <PasswordLinkSend />
</template>
