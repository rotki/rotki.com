import { type ParsedContent } from '@nuxt/content/dist/runtime/types';
import { serverQueryContent } from '#content/server';
import { CONTENT_PREFIX, LOCAL_CONTENT_PREFIX } from '~/utils/constants';

const getLink = (path?: string) =>
  path?.startsWith(CONTENT_PREFIX)
    ? `${path}`.replace(CONTENT_PREFIX, '')
    : path;

export default cachedEventHandler(
  async (event) => {
    let jobs: Pick<ParsedContent, '_path'>[];
    const dir = 'jobs';
    try {
      // try to fetch from remote
      jobs = await serverQueryContent(event)
        .where({
          _path: { $contains: `${CONTENT_PREFIX}/${dir}` },
          open: { $eq: true },
        })
        .only('_path')
        .find();
    } catch {
      // fallback to local if remote fails
      jobs = await serverQueryContent(event)
        .where({
          _dir: { $eq: `${LOCAL_CONTENT_PREFIX}/${dir}` },
          open: { $eq: true },
        })
        .only('_path')
        .find();
    }

    const now = new Date().toDateString();

    return jobs.map((job) => ({
      loc: getLink(job._path),
      lastmod: now,
      changefreq: 'daily',
      priority: 0.8,
    }));
  },
  {
    name: 'sitemap-dynamic-urls',
    maxAge: 60 * 10, // 10 minutes
  },
);
