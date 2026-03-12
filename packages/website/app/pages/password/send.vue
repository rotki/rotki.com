<script setup lang="ts">
import PasswordLinkSend from '~/components/account/password/PasswordLinkSend.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
});

usePageSeoNoIndex('recovery e-mail send');
</script>

<template>
  <PasswordLinkSend />
</template>
