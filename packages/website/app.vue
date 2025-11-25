<script setup lang="ts">
import { useStagingBranding } from '~/composables/use-staging-branding';

useStagingBranding();
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
