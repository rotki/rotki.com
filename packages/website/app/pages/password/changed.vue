<script setup lang="ts">
import PasswordChanged from '~/components/account/password/PasswordChanged.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  middleware: 'maintenance',
});

usePageSeoNoIndex('password changed');
</script>

<template>
  <PasswordChanged />
</template>
