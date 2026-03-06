<script lang="ts" setup>
import { get, isDefined } from '@vueuse/core';
import JobDetail from '~/components/jobs/JobDetail.vue';
import { useRemoteOrLocal } from '~/composables/use-remote-or-local';
import { commonAttrs, getMetadata } from '~/utils/metadata';

const { path } = useRoute();
const { fallbackToLocalOnError } = useRemoteOrLocal();
const { t } = useI18n({ useScope: 'global' });

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
      path,
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
