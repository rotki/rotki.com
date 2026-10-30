<script setup lang="ts">
import AccountActivate from '~/components/account/activation/AccountActivate.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
});

usePageSeoNoIndex('Activate your account');
</script>

<template>
  <AccountActivate />
</template>
