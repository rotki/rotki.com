<script lang="ts" setup>
import EmailPreferences from '~/components/account/home/EmailPreferences.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('Email Preferences');

definePageMeta({
  auth: true,
  layout: 'account',
});
</script>

<template>
  <EmailPreferences />
</template>
