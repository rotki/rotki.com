import { get, set } from '@vueuse/core';
import type { MarkdownParsedContent } from '@nuxt/content/dist/runtime/types';
import type { ComputedRef, Ref } from 'vue';
import { logger } from '~/utils/logger';
import { replacePathPrefix } from '~/utils/api';
import { GITHUB_CONTENT_PREFIX } from '~/utils/constants';

interface JobMarkdownContent extends MarkdownParsedContent {
  link?: string;
  open: boolean;
}

/**
 * Loads jobs and markdown content based on given path
 */
export const useMarkdownContent = () => {
  const jobs: Ref<JobMarkdownContent[]> = ref([]);
  const openJobs: ComputedRef<JobMarkdownContent[]> = computed(() =>
    get(jobs).filter((job) => job.open)
  );
  const firstJob: ComputedRef<JobMarkdownContent | null> = computed(
    () => get(openJobs)[0] ?? null
  );

  /**
   * fetches all markdown files within the jobs directory
   */
  const loadJobs = async () => {
    const path = `/jobs`;

    let foundJobs;

    try {
      const remotePath = `${GITHUB_CONTENT_PREFIX}${path}`;
      // try to fetch from remote
      foundJobs = await queryContent<JobMarkdownContent>(remotePath).find();
    } catch (e: any) {
      logger.error(e);
      // fallback to local if remote fails
      foundJobs = await queryContent<JobMarkdownContent>(path).find();
    }

    set(
      jobs,
      foundJobs?.map((job) => {
        job.link = replacePathPrefix(GITHUB_CONTENT_PREFIX, job._path);
        return job;
      }) ?? []
    );
  };

  /**
   * fetches a single markdown files within the jobs directory
   */
  const loadJob = async (path: string): Promise<JobMarkdownContent> => {
    try {
      const remotePath = `${GITHUB_CONTENT_PREFIX}${path}`;
      // try to fetch from remote
      const data = await queryContent<JobMarkdownContent>(remotePath).findOne();
      return {
        ...data,
        link: replacePathPrefix(GITHUB_CONTENT_PREFIX, data?._path),
      };
    } catch (e: any) {
      logger.error(e);

      // fallback to local if remote fails
      const data = await queryContent<JobMarkdownContent>(path).findOne();
      return {
        ...data,
        link: replacePathPrefix(GITHUB_CONTENT_PREFIX, data?._path),
      };
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
    loadJob,
    loadJobs,
    loadContent,
  };
};
