import { get, set } from '@vueuse/core';
import type { ParsedContent } from '@nuxt/content/dist/runtime/types';
import type { ComputedRef, Ref } from 'vue';
import { logger } from '~/utils/logger';

/**
 * Loads jobs and markdown content based on given path
 */
export const useMarkdownContent = () => {
  const jobs: Ref<ParsedContent[]> = ref([]);
  const openJobs: ComputedRef<ParsedContent[]> = computed(() =>
    get(jobs).filter((job) => job.open)
  );
  const firstJob: ComputedRef<ParsedContent | null> = computed(
    () => get(openJobs)[0] ?? null
  );

  /**
   * fetches all markdown files within the jobs directory
   */
  const loadJobs = async () => {
    try {
      const path = '/jobs';
      const { data } = await useAsyncData(path, queryContent(path).find);
      set(jobs, data.value ?? []);
    } catch (e: any) {
      logger.error(e);
    }
  };

  /**
   * fetches a single markdown content based on given path
   * @param path
   */
  const loadContent = async (path: string) => {
    try {
      const { data } = await useAsyncData(path, queryContent(path).findOne);
      return get(data);
    } catch (e: any) {
      logger.error(e);
    }
  };

  return {
    jobs,
    openJobs,
    firstJob,
    loadJobs,
    loadContent,
  };
};
