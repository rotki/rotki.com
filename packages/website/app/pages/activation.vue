<script setup lang="ts">
import PendingActivation from '~/components/account/activation/PendingActivation.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

definePageMeta({
  layout: 'focused',
});

usePageSeoNoIndex('Check your inbox');
</script>

<template>
  <PendingActivation />
</template>
