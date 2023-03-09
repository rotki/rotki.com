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

<style scoped>
:deep(ul) {
  @apply text-[#808080] list-[circle];
}
</style>
