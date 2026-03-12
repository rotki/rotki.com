<script setup lang="ts">
import SignupForm from '~/components/account/signup/SignupForm.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  backendRequired: true,
});

usePageSeoNoIndex('signup');
</script>

<template>
  <SignupForm />
</template>
