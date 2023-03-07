<script setup lang="ts">
const { data } = await useAsyncData('/', () =>
  queryContent('/documents/terms-of-service').findOne()
);
</script>

<template>
  <PageContainer>
    <template #title> {{ data?.title ?? '' }}</template>

    <ContentRenderer :value="data" />
  </PageContainer>
</template>
