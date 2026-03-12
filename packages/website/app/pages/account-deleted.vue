<script setup lang="ts">
import AccountDeletedPage from '~/components/account/delete/AccountDeletedPage.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('account deleted');
</script>

<template>
  <AccountDeletedPage />
</template>
