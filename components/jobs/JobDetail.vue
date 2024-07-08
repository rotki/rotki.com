<script setup lang="ts">
import { get } from '@vueuse/core';
import type { JobMarkdownContent } from '~/composables/markdown';

const props = defineProps<{
  data: JobMarkdownContent;
}>();

const { data } = toRefs(props);

const separatedData = computed<{
  default: JobMarkdownContent;
  blockquote: JobMarkdownContent;
}>(() => {
  const regularItems = [];
  const blockquoteItems = [];

  const dataVal = get(data);

  for (const item of dataVal.body.children) {
    if (item.tag !== 'blockquote')
      regularItems.push(item);
    else
      blockquoteItems.push(item);
  }

  return {
    default: {
      ...dataVal,
      body: {
        ...dataVal.body,
        children: regularItems,
      },
    },
    blockquote: {
      ...dataVal,
      body: {
        ...dataVal.body,
        children: blockquoteItems,
      },
    },
  };
});

const { t } = useI18n();
</script>

<template>
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
</template>
