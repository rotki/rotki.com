<script lang="ts" setup>
import AccountAddress from '~/components/account/home/AccountAddress.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('Address');

definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});
</script>

<template>
  <AccountAddress />
</template>
