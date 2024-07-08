import { get, objectPick, set } from '@vueuse/core';
import { groupBy } from 'graphql/jsutils/groupBy';
import { useLogger } from '~/utils/use-logger';
import { replacePathPrefix } from '~/utils/api';
import { CONTENT_PREFIX, LOCAL_CONTENT_PREFIX } from '~/utils/constants';
import type {
  MarkdownParsedContent,
  QueryBuilderWhere,
} from '@nuxt/content/dist/runtime/types';

export interface JobMarkdownContent extends MarkdownParsedContent {
  link?: string;
  open: boolean;
  category: string;
  tags: string[];
}

export interface TestimonialMarkdownContent extends MarkdownParsedContent {
  avatar?: string;
  visible: boolean;
  username: string;
  url: string;
}

/**
 * Loads jobs and markdown content based on given path
 */
export function useMarkdownContent() {
  const jobs = ref<JobMarkdownContent[]>([]);
  const testimonials = ref<TestimonialMarkdownContent[]>([]);
  const openJobs = computed<JobMarkdownContent[]>(() =>
    get(jobs).filter(job => job.open),
  );
  const groupedOpenJobsByCategory = computed<
    Record<string, readonly JobMarkdownContent[]>
  >(() =>
    Object.fromEntries(groupBy(get(openJobs), item => item.category ?? '')),
  );

  const firstJob = computed<JobMarkdownContent | null>(
    () => get(openJobs)[0] ?? null,
  );

  const logger = useLogger('markdown-content');

  /**
   * fetches all markdown files within the jobs directory
   */
  const loadAll = async <T>(path: string, where: QueryBuilderWhere = {}) => {
    let found;
    let prefix = CONTENT_PREFIX;

    try {
      // try to fetch from remote
      found = await queryContent<T>(`${prefix}${path}`).where(where).find();
    }
    catch (error: any) {
      logger.error(error);
      prefix = LOCAL_CONTENT_PREFIX;
      // fallback to local if remote fails
      found = await queryContent<T>(`${prefix}${path}`).where(where).find();
    }

    return { data: found ?? [], prefix };
  };

  /**
   * fetches all markdown files within the jobs directory
   */
  const loadJobs = async () => {
    const path = '/jobs';

    try {
      const { data, prefix } = await loadAll<JobMarkdownContent>(path);

      set(
        jobs,
        data?.map((job) => {
          job.link = replacePathPrefix(prefix, job._path);
          return job;
        }) ?? [],
      );
    }
    catch (error) {
      logger.error(error);
    }
  };

  /**
   * fetches all markdown files within the testimonials directory
   */
  const loadTestimonials = async () => {
    const path = '/testimonials';

    try {
      const { data } = await loadAll<TestimonialMarkdownContent>(path, {
        visible: true,
      });

      set(
        testimonials,
        data.map(testimonial =>
          objectPick(testimonial, [
            'avatar',
            'visible',
            'body',
            'username',
            'url',
          ]),
        ),
      );
    }
    catch (error) {
      logger.error(error);
    }
  };

  const queryPrefixForJob = async (
    prefix: typeof CONTENT_PREFIX,
    path: string,
  ): Promise<JobMarkdownContent | null> => {
    const prefixedPath = `${prefix}${path}`;
    try {
      const data
        = await queryContent<JobMarkdownContent>(prefixedPath).findOne();
      return {
        ...data,
        link: replacePathPrefix(prefix, data?._path),
      };
    }
    catch {
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
    }
    catch (error: any) {
      logger.error(error);

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
    }
    catch (error: any) {
      logger.error(error);
    }
  };

  return {
    firstJob,
    groupedOpenJobsByCategory,
    jobs,
    loadContent,
    loadJob,
    loadJobs,
    loadTestimonials,
    openJobs,
    testimonials,
  };
}
