<script lang="ts" setup>
import type { JobsLocalCollectionItem, JobsRemoteCollectionItem } from '@nuxt/content';
import { get } from '@vueuse/shared';
import JobDescription from '~/components/jobs/JobDescription.vue';
import { usePageSeo } from '~/composables/use-page-seo';
import { useRemoteOrLocal } from '~/composables/use-remote-or-local';

type JobsCollectionItem = JobsLocalCollectionItem | JobsRemoteCollectionItem;

const { fallbackToLocalOnError } = useRemoteOrLocal();

const { data: jobs } = await useAsyncData('jobs', () => fallbackToLocalOnError(
  async () => await queryCollection('jobsRemote').all(),
  async () => await queryCollection('jobsLocal').all(),
));

const { t } = useI18n({ useScope: 'global' });

const title = t('jobs.title');
const header = t('jobs.header');
const subheader = t('jobs.description');

usePageSeo(title, header, '/jobs');

const grouped = computed<Record<string, JobsCollectionItem[]>>(() => {
  const group: Record<string, JobsCollectionItem[]> = {};
  const allJobs = get(jobs);

  if (!allJobs)
    return group;

  for (const job of allJobs) {
    if (!job.open) {
      continue;
    }
    const existing = group[job.category];
    if (existing) {
      existing.push(job);
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
        <div
          v-else
          class="flex flex-col items-center text-center py-12"
        >
          <div class="bg-rui-grey-200 rounded-full p-4 mb-4">
            <RuiIcon
              name="lu-briefcase"
              size="32"
              class="text-rui-grey-500"
            />
          </div>
          <h3 class="text-h6 font-medium mb-2">
            {{ t('jobs.no_open_roles_title') }}
          </h3>
          <p class="text-rui-text-secondary max-w-md">
            {{ t('jobs.no_open_roles') }}
          </p>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
