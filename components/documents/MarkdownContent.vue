<script lang="ts" setup>
import { useMarkdownContent } from '~/composables/markdown';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const props = defineProps<{ path: string }>();

const {
  public: { baseUrl },
} = useRuntimeConfig();
const { loadContent } = useMarkdownContent();

const data = await loadContent(props.path);

if (!data) {
  showError({ message: `Page not found: ${props.path}`, statusCode: 404 });
}
else {
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
  <div class="py-10 md:py-20 border-b border-rui-grey-300">
    <div class="container flex flex-col lg:flex-row gap-8 justify-between">
      <div v-if="data?.subtitle">
        <div
          v-if="data?.title"
          class="text-h6 text-rui-primary mb-3"
        >
          {{ data.title }}
        </div>
        <div
          v-if="data?.subtitle"
          class="text-h4"
        >
          {{ data.subtitle }}
        </div>
      </div>
      <div v-else-if="data?.title">
        <div class="text-h4">
          {{ data.title }}
        </div>
      </div>
      <div
        v-if="data?.address"
        class="whitespace-pre-line text-body-1 text-rui-grey-600"
      >
        {{ data.address }}
      </div>
    </div>
  </div>

  <div class="py-10 md:py-20">
    <div class="container lg:max-w-[720px]">
      <ContentRenderer
        v-if="data"
        :value="data"
      >
        <ContentRendererMarkdown :value="data" />
      </ContentRenderer>
    </div>
  </div>
</template>
