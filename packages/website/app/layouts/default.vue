<script setup lang="ts">
/*
 * The body lives in PageLayout so other layouts can reuse it without importing
 * this file. A layout that is also a static import gets merged into a shared
 * chunk the SSR manifest cannot map back to this file, so prerendered pages
 * never preload it and hydration waits for an extra round trip.
 */
import PageLayout from '~/components/layout/PageLayout.vue';

defineSlots<{
  default: () => void;
}>();
</script>

<template>
  <PageLayout>
    <slot />
  </PageLayout>
</template>
