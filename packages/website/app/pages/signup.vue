<script setup lang="ts">
import SignupForm from '~/components/account/signup/SignupForm.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  middleware: 'maintenance',
});

usePageSeoNoIndex('signup');
</script>

<template>
  <SignupForm />
</template>
