<script lang="ts" setup>
import { commonAttrs, getMetadata } from '~/utils/metadata';
import { useMarkdownContent } from '~/composables/markdown';

const {
  public: { baseUrl },
} = useRuntimeConfig();
const { path } = useRoute();
const { loadJob } = useMarkdownContent();

const data = await loadJob(path);

if (!data?.open) {
  showError({ message: `Page not found: ${path}`, statusCode: 404 });
} else {
  useContentHead(data);
  const { title, description } = data;

  useHead({
    meta: getMetadata(
      title ?? '',
      description ?? '',
      `${baseUrl}${path}`,
      baseUrl,
    ),
    ...commonAttrs(),
  });
}

definePageMeta({
  layout: false,
});
</script>

<template>
  <NuxtLayout v-if="data" name="jobs">
    <template #title>{{ data.title }}</template>
    <JobDetail :data="data" />
  </NuxtLayout>
</template>
