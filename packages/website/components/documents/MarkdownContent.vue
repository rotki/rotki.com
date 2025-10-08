<script lang="ts" setup>
import { get } from '@vueuse/core';
import { useRemoteOrLocal } from '~/composables/use-remote-or-local';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const props = defineProps<{ path: string }>();

const { fallbackToLocalOnError } = useRemoteOrLocal();

const { data: document } = await useAsyncData(props.path, async () => fallbackToLocalOnError(
  async () => queryCollection('documentsRemote').path(props.path).first(),
  async () => await queryCollection('documentsLocal').path(props.path).first(),
));

if (!document) {
  showError({ message: `Page not found: ${props.path}`, statusCode: 404 });
}
else {
  useHead({
    meta: getMetadata(
      get(document)?.title ?? '',
      get(document)?.description ?? '',
      props.path,
    ),
    ...commonAttrs(),
  });
}
</script>

<template>
  <div class="py-6 md:py-12 border-b border-rui-grey-300">
    <div class="container flex flex-col lg:flex-row gap-8 justify-between">
      <div v-if="document?.subtitle">
        <div
          v-if="document?.title"
          class="text-h6 text-rui-primary mb-3"
        >
          {{ document.title }}
        </div>
        <div
          v-if="document?.subtitle"
          class="text-h4"
        >
          {{ document.subtitle }}
        </div>
      </div>
      <div v-else-if="document?.title">
        <div class="text-h4">
          {{ document.title }}
        </div>
      </div>
      <div
        v-if="document?.address"
        class="whitespace-pre-line text-body-1 text-rui-grey-600"
      >
        {{ document.address.split('\\n').join('\n') }}
      </div>
    </div>
  </div>

  <div class="py-6 md:py-12 border-b border-rui-grey-300">
    <div class="container">
      <div class="max-w-[900px]">
        <ContentRenderer
          v-if="document"
          :value="document"
        />
      </div>
    </div>
  </div>
</template>
