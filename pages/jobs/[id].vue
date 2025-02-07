<script lang="ts" setup>
import { get } from '@vueuse/core';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const { public: { baseUrl } } = useRuntimeConfig();
const { path } = useRoute();
const { fallbackToLocalOnError } = useRemoteOrLocal();

const { data: job } = await useAsyncData(path, () => fallbackToLocalOnError(
  async () => await queryCollection('jobsRemote').path(path).first(),
  async () => await queryCollection('jobsLocal').path(path).first(),
));

if (!get(job)?.open) {
  showError({ message: `Page not found: ${path}`, statusCode: 404 });
}
else {
  useHead({
    meta: getMetadata(
      get(job)?.title ?? '',
      get(job)?.description ?? '',
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
  <NuxtLayout
    v-if="job"
    name="jobs"
  >
    <template #title>
      {{ job.title }}
    </template>
    <JobDetail :data="job" />
  </NuxtLayout>
</template>
