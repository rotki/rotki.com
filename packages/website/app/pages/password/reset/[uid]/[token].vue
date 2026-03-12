<script setup lang="ts">
import PasswordReset from '~/components/account/password/PasswordReset.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  middleware: 'maintenance',
});

usePageSeoNoIndex('reset password');
</script>

<template>
  <PasswordReset />
</template>
