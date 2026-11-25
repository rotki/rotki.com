<script setup lang="ts">
import { definePageMeta } from '#app/composables/pages';
import PasswordChanged from '~/components/account/password/PasswordChanged.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
  layout: 'focused',
});

usePageSeoNoIndex('Password changed');
</script>

<template>
  <PasswordChanged />
</template>
