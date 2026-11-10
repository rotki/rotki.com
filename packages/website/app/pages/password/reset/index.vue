<script setup lang="ts">
import PasswordReset from '~/components/account/password/PasswordReset.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
  layout: 'focused',
});

usePageSeoNoIndex('Set a new password');
</script>

<template>
  <PasswordReset />
</template>
