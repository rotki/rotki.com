<script lang="ts" setup>
import { navigateTo } from '#app';
import { definePageMeta } from '#app/composables/pages';

definePageMeta({
  // In-app visits reload into Billing, so it arrives with the CSP its card forms need
  middleware: () => navigateTo('/home/billing', { external: true, replace: true }),
});
</script>

<template>
  <div />
</template>
