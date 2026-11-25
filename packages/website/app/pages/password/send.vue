<script setup lang="ts">
import { definePageMeta } from '#app/composables/pages';
import PasswordLinkSend from '~/components/account/password/PasswordLinkSend.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
  layout: 'focused',
});

usePageSeoNoIndex('Check your inbox');
</script>

<template>
  <PasswordLinkSend />
</template>
