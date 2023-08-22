import { get, set } from '@vueuse/core';
import { groupBy } from 'graphql/jsutils/groupBy';
import type { MarkdownParsedContent } from '@nuxt/content/dist/runtime/types';
import type { ComputedRef, Ref } from 'vue';
import { replacePathPrefix } from '~/utils/api';
import { CONTENT_PREFIX, LOCAL_CONTENT_PREFIX } from '~/utils/constants';
import { logger } from '~/utils/logger';

export interface JobMarkdownContent extends MarkdownParsedContent {
  link?: string;
  open: boolean;
  category: string;
  tags: string[];
}

/**
 * Loads jobs and markdown content based on given path
 */
export const useMarkdownContent = () => {
  const jobs: Ref<JobMarkdownContent[]> = ref([]);
  const openJobs: ComputedRef<JobMarkdownContent[]> = computed(() =>
    get(jobs).filter((job) => job.open),
  );
  const groupedOpenJobsByCategory: ComputedRef<
    Record<string, readonly JobMarkdownContent[]>
  > = computed(() =>
    Object.fromEntries(groupBy(get(openJobs), (item) => item.category ?? '')),
  );

  const firstJob: ComputedRef<JobMarkdownContent | null> = computed(
    () => get(openJobs)[0] ?? null,
  );

  /**
   * fetches all markdown files within the jobs directory
   */
  const loadJobs = async () => {
    const path = `/jobs`;

    let foundJobs;
    let prefix = CONTENT_PREFIX;

    try {
      // try to fetch from remote
      foundJobs = await queryContent<JobMarkdownContent>(
        `${prefix}${path}`,
      ).find();
    } catch (e: any) {
      logger.error(e);
      prefix = LOCAL_CONTENT_PREFIX;
      // fallback to local if remote fails
      foundJobs = await queryContent<JobMarkdownContent>(
        `${prefix}${path}`,
      ).find();
    }

    set(
      jobs,
      foundJobs?.map((job) => {
        job.link = replacePathPrefix(prefix, job._path);
        return job;
      }) ?? [],
    );
  };

  const queryPrefixForJob = async (
    prefix: typeof CONTENT_PREFIX,
    path: string,
  ): Promise<JobMarkdownContent | null> => {
    const prefixedPath = `${prefix}${path}`;
    try {
      const data = await queryContent<JobMarkdownContent>(
        prefixedPath,
      ).findOne();
      return {
        ...data,
        link: replacePathPrefix(prefix, data?._path),
      };
    } catch {
      return null;
    }
  };

  /**
   * fetches a single markdown files within the jobs directory
   */
  const loadJob = async (path: string): Promise<JobMarkdownContent | null> => {
    try {
      // try to fetch from prefix
      return await queryPrefixForJob(CONTENT_PREFIX, path);
    } catch (e: any) {
      logger.error(e);

      // fallback to local if remote fails
      return await queryPrefixForJob(LOCAL_CONTENT_PREFIX, path);
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
    groupedOpenJobsByCategory,
    firstJob,
    loadJob,
    loadJobs,
    loadContent,
  };
};
