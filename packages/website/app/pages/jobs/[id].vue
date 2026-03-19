<script lang="ts" setup>
import { isDefined } from '@vueuse/core';
import { get } from '@vueuse/shared';
import JobDetail from '~/components/jobs/JobDetail.vue';
import { usePageSeo } from '~/composables/use-page-seo';

const { path } = useRoute();
const { t } = useI18n({ useScope: 'global' });

const { data: job } = await useAsyncData(path, () => queryCollection('jobs').path(path).first(), { dedupe: 'defer' });

if (!isDefined(job)) {
  showError({ message: `Page not found: ${path}`, status: 404 });
}
else {
  const { title, description, open } = get(job);

  const meta = {
    title: open ? title : `${title} (${t('jobs.role_unavailable.title')})`,
    description: open ? description : t('jobs.role_unavailable.description', { title }),
  };

  usePageSeo(meta.title, meta.description, path);
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
