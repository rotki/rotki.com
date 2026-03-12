<script setup lang="ts">
import PasswordForm from '~/components/account/password/PasswordForm.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  middleware: 'maintenance',
});

usePageSeoNoIndex('password recovery');
</script>

<template>
  <PasswordForm />
</template>
