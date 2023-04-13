<script setup lang="ts">
const css = useCssModule();

const { data } = await useAsyncData('/documents/tos', () =>
  queryContent('/documents/terms-of-service').findOne()
);
</script>

<template>
  <PageContainer>
    <template #title> {{ data?.title ?? '' }}</template>

    <ContentRenderer v-if="data" :value="data" :class="css.content">
      <ContentRendererMarkdown :value="data" />
    </ContentRenderer>
  </PageContainer>
</template>

<style module lang="scss">
.content {
  ul {
    @apply text-[#808080] list-[circle];
  }
}
</style>
