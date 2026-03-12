<script setup lang="ts">
import PasswordLinkSend from '~/components/account/password/PasswordLinkSend.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  middleware: 'maintenance',
});

usePageSeoNoIndex('recovery e-mail send');
</script>

<template>
  <PasswordLinkSend />
</template>
