import type { GithubRelease } from '~/types/github';
import { CACHE_TTL } from '~/server/utils/cache';
import { getCacheService } from '~/server/utils/cache-service';
import { useLogger } from '~/utils/use-logger';

export const CACHE_KEY = 'github:releases:latest';

export const STALE_CACHE_KEY = 'github:releases:latest:stale';

export const ETAG_CACHE_KEY = 'github:releases:latest:etag';

export const GITHUB_API_URL = 'https://api.github.com/repos/rotki/rotki/releases/latest';

const HTTP_NOT_MODIFIED = 304;
const STALE_CACHE_TTL = 24 * 60 * 60; // 24 hours
const STALE_WHILE_REVALIDATE = 3600; // 1 hour

const logger = useLogger('releases-api');

export interface GithubApiRelease {
  readonly tag_name: string;
  readonly assets: {
    readonly name: string;
    readonly browser_download_url: string;
  }[];
}

/**
 * Checks if the asset is a downloadable app (Windows, Linux, or macOS)
 */
export function isDownloadableApp(name: string): boolean {
  const isWindowsApp = name.endsWith('.exe') && name.startsWith('rotki-win32');
  const isLinuxApp = name.endsWith('.AppImage');
  const isMacOsApp = name.endsWith('.dmg') && (name.includes('arm64') || name.includes('x64'));
  return isWindowsApp || isLinuxApp || isMacOsApp;
}

/**
 * Extracts only the fields we need from GitHub's response
 * and filters to only include downloadable app assets
 */
export function minimizePayload(release: GithubApiRelease): GithubRelease {
  return {
    tag_name: release.tag_name,
    assets: release.assets
      .filter(asset => isDownloadableApp(asset.name))
      .map(asset => ({
        name: asset.name,
        browser_download_url: asset.browser_download_url,
      })),
  };
}

export default defineEventHandler(async (event): Promise<GithubRelease> => {
  const cache = getCacheService();

  // Set cache headers for client-side caching
  setResponseHeaders(event, {
    'Cache-Control': `public, max-age=${CACHE_TTL.RELEASE_ID}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
  });

  // Try cache first (within TTL)
  const cached = await cache.getItem<GithubRelease>(CACHE_KEY);
  if (cached) {
    logger.debug('Returning cached GitHub release data');
    return cached;
  }

  // Cache expired - fetch from GitHub with conditional request
  try {
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'rotki.com',
    };

    // Add ETag for conditional request if available
    const storedEtag = await cache.getItem<string>(ETAG_CACHE_KEY);
    if (storedEtag) {
      headers['If-None-Match'] = storedEtag;
    }

    logger.info('Fetching latest release from GitHub API');
    const response = await $fetch.raw<GithubApiRelease>(GITHUB_API_URL, { headers });

    // GitHub returns 304 Not Modified if ETag matches (data unchanged)
    if (response.status === HTTP_NOT_MODIFIED) {
      logger.debug('GitHub returned 304 Not Modified, refreshing cache TTL');
      const stale = await cache.getItem<GithubRelease>(STALE_CACHE_KEY);
      if (stale) {
        // Refresh the primary cache TTL
        await cache.setItem(CACHE_KEY, stale, { ttl: CACHE_TTL.RELEASE_ID });
        return stale;
      }
    }

    const release = minimizePayload(response._data!);

    // Store the ETag for future conditional requests
    const newEtag = response.headers.get('etag');
    if (newEtag) {
      await cache.setItem(ETAG_CACHE_KEY, newEtag, { ttl: STALE_CACHE_TTL });
    }

    // Cache the minimized response
    await cache.setItem(CACHE_KEY, release, { ttl: CACHE_TTL.RELEASE_ID });
    // Store stale copy for fallback (longer TTL)
    await cache.setItem(STALE_CACHE_KEY, release, { ttl: STALE_CACHE_TTL });
    logger.info(`Cached GitHub release: ${release.tag_name}`);

    return release;
  }
  catch (error) {
    logger.error('Failed to fetch GitHub release:', error);

    // Try to return stale data if available
    const stale = await cache.getItem<GithubRelease>(STALE_CACHE_KEY);
    if (stale) {
      logger.warn(`Returning stale GitHub release data: ${stale.tag_name}`);
      return stale;
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch release information from GitHub',
    });
  }
});
