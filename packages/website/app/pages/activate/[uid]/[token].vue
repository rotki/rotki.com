<script setup lang="ts">
import AccountActivate from '~/components/account/activation/AccountActivate.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  middleware: 'maintenance',
});

usePageSeoNoIndex('activate account');
</script>

<template>
  <AccountActivate />
</template>
