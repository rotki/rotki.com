<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'sponsorship',
});

await navigateTo('/sponsor/mint', { redirectCode: 301 });
</script>

<template>
  <div />
</template>
