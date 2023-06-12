<script lang="ts" setup>
import { commonAttrs, getMetadata } from '~/utils/metadata';
import { useMarkdownContent } from '~/composables/markdown';

const {
  public: { baseUrl },
} = useRuntimeConfig();
const { path } = useRoute();
const { loadContent } = useMarkdownContent();

const data = await loadContent(path);

if (!data?.open) {
  showError({ message: `Page not found: ${path}`, statusCode: 404 });
} else {
  useContentHead(data);
  const { title, description } = data;

  useHead({
    meta: getMetadata(title, description, `${baseUrl}${path}`, baseUrl),
    ...commonAttrs(),
  });
}
</script>

<template>
  <NuxtLayout name="jobs">
    <ContentRenderer v-if="data" :value="data">
      <ContentRendererMarkdown :value="data" />
    </ContentRenderer>
  </NuxtLayout>
</template>
