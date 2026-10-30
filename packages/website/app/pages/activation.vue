<script setup lang="ts">
import PendingActivation from '~/components/account/activation/PendingActivation.vue';
import { usePageSeoNoIndex } from '~/composables/use-page-seo';

usePageSeoNoIndex('Confirm your e-mail address');
</script>

<template>
  <PendingActivation />
</template>
