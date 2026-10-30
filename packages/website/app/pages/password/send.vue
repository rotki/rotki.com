<script setup lang="ts">
import PasswordLinkSend from '~/components/account/password/PasswordLinkSend.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
});

usePageSeoNoIndex('Check your inbox');
</script>

<template>
  <PasswordLinkSend />
</template>
