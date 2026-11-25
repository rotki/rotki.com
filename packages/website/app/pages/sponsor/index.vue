<script setup lang="ts">
import { navigateTo } from '#app';
import { definePageMeta } from '#app/composables/pages';

definePageMeta({
  layout: false,
});

await navigateTo('/sponsor/mint', { redirectCode: 301 });
</script>

<template>
  <div />
</template>
