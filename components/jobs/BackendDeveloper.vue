<script setup lang="ts">
const { data } = await useAsyncData('/jobs/backend', () =>
  queryContent('/jobs/backend').findOne()
);
</script>

<template>
  <ContentRenderer :value="data">
    <ContentRendererMarkdown :value="data" />
  </ContentRenderer>
</template>
