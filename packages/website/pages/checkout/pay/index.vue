<script lang="ts" setup>
import { commonAttrs, noIndex } from '~/utils/metadata';

definePageMeta({
  middleware: ['maintenance', 'unverified', 'pending-payment'],
});

useHead({
  title: 'select premium plan',
  meta: [
    {
      name: 'description',
      content: 'Select your rotki premium plan',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});
</script>

<template>
  <PlanSelection />
</template>
