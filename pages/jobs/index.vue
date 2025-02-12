<script lang="ts" setup>
import { get } from '@vueuse/core';
import JobDescription from '~/components/jobs/JobDescription.vue';
import { commonAttrs, getMetadata } from '~/utils/metadata';
import type { JobsLocalCollectionItem, JobsRemoteCollectionItem } from '@nuxt/content';

type JobsCollectionItem = JobsLocalCollectionItem | JobsRemoteCollectionItem;

const { fallbackToLocalOnError } = useRemoteOrLocal();

const { data: jobs } = await useAsyncData('jobs', () => fallbackToLocalOnError(
  async () => await queryCollection('jobsRemote').all(),
  async () => await queryCollection('jobsLocal').all(),
));

const { t } = useI18n();

const title = t('jobs.title');
const header = t('jobs.header');
const subheader = t('jobs.description');

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, header, `${baseUrl}/jobs`, baseUrl),
  ...commonAttrs(),
});

const grouped = computed<Record<string, JobsCollectionItem[]>>(() => {
  const group: Record<string, JobsCollectionItem[]> = {};
  const allJobs = get(jobs);

  if (!allJobs)
    return group;

  for (const job of allJobs) {
    if (!job.open) {
      continue;
    }
    if (group[job.category]) {
      group[job.category].push(job);
    }
    else {
      group[job.category] = [job];
    }
  }
  return group;
});

definePageMeta({
  layout: false,
});
</script>

<template>
  <NuxtLayout name="jobs">
    <template #title>
      {{ header }}
    </template>
    <template #description>
      {{ subheader }}
    </template>
    <div class="py-8 lg:py-20">
      <div class="container">
        <div
          v-if="Object.keys(grouped).length > 0"
          class="space-y-8"
        >
          <div
            v-for="(groupJobs, category) in grouped"
            :key="category"
            class="space-y-6"
          >
            <div
              v-if="category"
              class="text-h6 font-medium"
            >
              {{ category }}
            </div>
            <div class="space-y-6">
              <NuxtLink
                v-for="job in groupJobs"
                :key="job.title"
                class="block cursor-pointer"
                :to="job.path"
              >
                <JobDescription :job="job" />
              </NuxtLink>
            </div>
          </div>
        </div>
        <div v-else>
          <TextParagraph>{{ t('jobs.no_open_roles') }}</TextParagraph>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
