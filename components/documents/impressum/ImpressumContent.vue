<script setup lang="ts">
const { data } = await useAsyncData('/documents/impressum', () =>
  queryContent('/documents/impressum').findOne()
);
</script>

<template>
  <PageContainer>
    <template #title> {{ data?.title ?? '' }}</template>

    <ContentRenderer v-if="data" :value="data">
      <ContentRendererMarkdown :value="data" />
    </ContentRenderer>
  </PageContainer>
</template>
