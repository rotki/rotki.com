<script lang="ts" setup>
import AccountInformation from '~/components/account/home/AccountInformation.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('Customer Information');

definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});
</script>

<template>
  <AccountInformation />
</template>
