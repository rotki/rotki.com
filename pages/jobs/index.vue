<script lang="ts" setup>
import JobDescription from '~/components/jobs/JobDescription.vue';
import { commonAttrs, getMetadata } from '~/utils/metadata';
import { useMarkdownContent } from '~/composables/markdown';

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

const { groupedOpenJobsByCategory, loadJobs } = useMarkdownContent();

await loadJobs();

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
          v-if="Object.keys(groupedOpenJobsByCategory).length > 0"
          class="space-y-8"
        >
          <div
            v-for="(jobs, category) in groupedOpenJobsByCategory"
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
                v-for="job in jobs"
                :key="job.title"
                class="block cursor-pointer"
                :to="job.link"
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
