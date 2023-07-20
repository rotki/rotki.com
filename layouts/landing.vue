<script setup lang="ts">
import Default from '~/layouts/default.vue';
</script>

<template>
  <Default>
    <slot />
    <template #footer>
      <PageFooter landing />
    </template>
  </Default>
</template>
