<script setup lang="ts">
import PageFooter from '~/components/footer/PageFooter.vue';
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
