<script lang="ts" setup>
import AccountAddress from '~/components/account/home/AccountAddress.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('Address');

definePageMeta({
  auth: true,
  layout: 'account',
});
</script>

<template>
  <AccountAddress />
</template>
