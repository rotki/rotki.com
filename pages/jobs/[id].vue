<script lang="ts" setup>
import { get } from '@vueuse/core';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const { public: { baseUrl } } = useRuntimeConfig();
const { path } = useRoute();
const { fallbackToLocalOnError } = useRemoteOrLocal();
const { t } = useI18n();

const { data: job } = await useAsyncData(path, () => fallbackToLocalOnError(
  async () => await queryCollection('jobsRemote').path(path).first(),
  async () => await queryCollection('jobsLocal').path(path).first(),
));

if (!isDefined(job)) {
  showError({ message: `Page not found: ${path}`, statusCode: 404 });
}
else {
  const { title, description, open } = get(job);

  const meta = {
    title: open ? title : `${title} (${t('jobs.role_unavailable.title')})`,
    description: open ? description : t('jobs.role_unavailable.description', { title }),
  };

  useHead({
    meta: getMetadata(
      meta.title,
      meta.description,
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
    <JobDetail
      v-if="job.open"
      :data="job"
    />
    <div class="py-8 lg:py-20">
      <div class="container flex flex-col lg:flex-row">
        <div>
          <div class="text-h5 font-medium mb-4">
            {{ t("jobs.role_unavailable.title") }}
          </div>

          {{ t("jobs.role_unavailable.description", { title: job.title }) }}
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
