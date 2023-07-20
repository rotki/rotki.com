<script lang="ts" setup>
import { commonAttrs, getMetadata } from '~/utils/metadata';
import {
  type JobMarkdownContent,
  useMarkdownContent,
} from '~/composables/markdown';

const {
  public: { baseUrl },
} = useRuntimeConfig();
const { path } = useRoute();
const { loadJob } = useMarkdownContent();

const data = await loadJob(path);
const separatedData: ComputedRef<{
  default: JobMarkdownContent;
  blockquote: JobMarkdownContent;
}> = computed(() => {
  const regularItems = [];
  const blockquoteItems = [];

  for (const item of data.body.children) {
    if (item.tag !== 'blockquote') {
      regularItems.push(item);
    } else {
      blockquoteItems.push(item);
    }
  }

  return {
    default: {
      ...data,
      body: {
        ...data.body,
        children: regularItems,
      },
    },
    blockquote: {
      ...data,
      body: {
        ...data.body,
        children: blockquoteItems,
      },
    },
  };
});

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

const { t } = useI18n();
</script>

<template>
  <NuxtLayout name="jobs">
    <template #title>{{ data.title }}</template>
    <div class="py-8 lg:py-20">
      <div class="container flex flex-col lg:flex-row">
        <div class="grow">
          <ContentRenderer
            v-if="separatedData.default"
            :value="separatedData.default"
          >
            <ContentRendererMarkdown :value="separatedData.default" />
          </ContentRenderer>
        </div>
        <div
          v-if="separatedData.blockquote.body.children.length > 0"
          class="mt-8 lg:mt-0 lg:pl-16 xl:pl-24"
        >
          <div class="bg-rui-primary/[.04] p-6 lg:w-[384px]">
            <div class="flex">
              <div class="bg-white rounded-lg p-3 text-rui-primary">
                <RuiIcon name="lightbulb-line" />
              </div>
            </div>
            <ContentRenderer
              v-if="separatedData.blockquote"
              :value="separatedData.blockquote"
            >
              <ContentRendererMarkdown :value="separatedData.blockquote" />
            </ContentRenderer>
            <ButtonLink
              to="mailto:careers@rotki.com"
              external
              color="primary"
              variant="default"
            >
              {{ t('actions.apply') }}
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
