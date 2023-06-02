<script setup lang="ts">
const { data } = await useAsyncData('/job/ui-ux', () =>
  queryContent('/jobs/ui-ux').findOne()
);
</script>

<template>
  <ContentRenderer v-if="data" :value="data">
    <ContentRendererMarkdown :value="data" />
  </ContentRenderer>
</template>
