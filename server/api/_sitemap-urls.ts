import { CONTENT_PREFIX, LOCAL_CONTENT_PREFIX } from '~/utils/constants';
import type { ParsedContent } from '@nuxt/content';
import { serverQueryContent } from '#content/server';

function getLink(path?: string) {
  return path?.startsWith(CONTENT_PREFIX)
    ? `${path}`.replace(CONTENT_PREFIX, '')
    : path;
}

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
    }
    catch {
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

    return jobs.map(job => ({
      changefreq: 'daily',
      lastmod: now,
      loc: getLink(job._path),
      priority: 0.8,
    }));
  },
  {
    maxAge: 60 * 10, // 10 minutes
    name: 'sitemap-dynamic-urls',
  },
);
