<script setup lang="ts">
import LoginPage from '~/components/account/login/LoginPage.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  guestOnly: true,
});

usePageSeoNoIndex('login');
</script>

<template>
  <LoginPage />
</template>
