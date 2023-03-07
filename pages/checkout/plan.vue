<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: ['maintenance', 'pending-payment', 'subscriber'],
});

useHead({
  title: 'select premium plan | rotki',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'Select your rotki premium plan',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
</script>

<template>
  <PlanSelectionPage />
</template>
