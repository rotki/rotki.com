<script setup lang="ts">
import { definePageMeta } from '#app/composables/pages';
import AccountActivate from '~/components/account/activation/AccountActivate.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
  layout: 'focused',
});

usePageSeoNoIndex('Activate your account');
</script>

<template>
  <AccountActivate />
</template>
