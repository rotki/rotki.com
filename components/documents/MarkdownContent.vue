<script lang="ts" setup>
import { useMarkdownContent } from '~/composables/markdown';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const props = defineProps<{ path: string }>();

const {
  public: { baseUrl },
} = useRuntimeConfig();
const css = useCssModule();
const { loadContent } = useMarkdownContent();

const data = await loadContent(props.path);

if (!data) {
  showError({ message: `Page not found: ${props.path}`, statusCode: 404 });
} else {
  useContentHead(data);
  const { title, description } = data;

  useHead({
    meta: getMetadata(
      title ?? '',
      description ?? '',
      `${baseUrl}${props.path}`,
      baseUrl,
    ),
    ...commonAttrs(),
  });
}
</script>

<template>
  <PageContainer>
    <template #title> {{ data?.title ?? '' }}</template>

    <ContentRenderer v-if="data" :class="css.content" :value="data">
      <ContentRendererMarkdown :value="data" />
    </ContentRenderer>
  </PageContainer>
</template>

<style lang="scss" module>
.content {
  ul {
    @apply text-[#808080] list-[circle];
  }
}
</style>
