<script lang="ts" setup>
import AccountInformation from '~/components/account/home/AccountInformation.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('Customer Information');

definePageMeta({
  auth: true,
  layout: 'account',
});
</script>

<template>
  <AccountInformation />
</template>
