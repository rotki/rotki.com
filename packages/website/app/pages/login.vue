<script setup lang="ts">
import LoginForm from '~/components/account/login/LoginForm.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  guestOnly: true,
  layout: 'focused',
});

usePageSeoNoIndex('Sign in');
</script>

<template>
  <LoginForm />
</template>
