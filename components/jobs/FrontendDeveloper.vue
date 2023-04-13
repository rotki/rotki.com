<script setup lang="ts">
const { data } = await useAsyncData('/job/frontend', () =>
  queryContent('/jobs/frontend').findOne()
);
</script>

<template>
  <ContentRenderer v-if="data" :value="data">
    <ContentRendererMarkdown :value="data" />
  </ContentRenderer>
</template>
