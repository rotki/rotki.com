<template>
  <PageContainer>
    <template #title> {{ data?.title ?? '' }}</template>

    <ContentRenderer :value="data" />
  </PageContainer>
</template>

<script setup lang="ts">
const { data } = await useAsyncData('/', () =>
  queryContent('/documents/terms-of-service').findOne()
)
</script>
