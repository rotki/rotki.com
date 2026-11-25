<script setup lang="ts">
import { definePageMeta } from '#app/composables/pages';
import PasswordForm from '~/components/account/password/PasswordForm.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
  layout: 'focused',
});

usePageSeoNoIndex('Reset your password');
</script>

<template>
  <PasswordForm />
</template>
