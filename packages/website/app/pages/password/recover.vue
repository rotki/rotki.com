<script setup lang="ts">
import PasswordForm from '~/components/account/password/PasswordForm.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
});

usePageSeoNoIndex('Reset your password');
</script>

<template>
  <PasswordForm />
</template>
