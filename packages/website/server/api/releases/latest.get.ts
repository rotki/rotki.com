import type { GithubRelease } from '#shared/types/github';
import { useLogger } from '#shared/utils/use-logger';
import { CACHE_TTL } from '~~/server/utils/cache';
import { getCacheService } from '~~/server/utils/cache-service';
import { memoryCache } from '~~/server/utils/memory-cache';
import { acquireLock, releaseLock } from '~~/server/utils/redis-lock';

// Cache keys
export const CACHE_KEY = 'github:releases:latest';

export const STALE_CACHE_KEY = 'github:releases:latest:stale';

export const ETAG_CACHE_KEY = 'github:releases:latest:etag';

export const LOCK_KEY = 'github:releases:latest';

// External API
export const GITHUB_API_URL = 'https://api.github.com/repos/rotki/rotki/releases/latest';

// TTL Configuration
const L1_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes (in-memory)
const STALE_CACHE_TTL = 24 * 60 * 60; // 24 hours (Redis)
const STALE_WHILE_REVALIDATE = 3600; // 1 hour (HTTP header)
const LOCK_WAIT_MS = 100; // Wait time when lock is busy

const HTTP_NOT_MODIFIED = 304;

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

/**
 * Fetch the latest release from GitHub API
 * Exported for use by the scheduled task
 * Updates both L1 (memory) and L2 (Redis) caches
 */
export async function fetchGithubRelease(): Promise<GithubRelease> {
  const cache = getCacheService();

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
      // Refresh the primary cache TTL and L1 cache
      await cache.setItem(CACHE_KEY, stale, { ttl: CACHE_TTL.RELEASE_ID });
      updateL1Cache(stale);
      return stale;
    }
  }

  const release = minimizePayload(response._data!);

  // Cache all data in parallel (independent operations)
  const cachePromises: Promise<void>[] = [
    cache.setItem(CACHE_KEY, release, { ttl: CACHE_TTL.RELEASE_ID }),
    cache.setItem(STALE_CACHE_KEY, release, { ttl: STALE_CACHE_TTL }),
  ];

  // Store the ETag for future conditional requests
  const newEtag = response.headers.get('etag');
  if (newEtag) {
    cachePromises.push(cache.setItem(ETAG_CACHE_KEY, newEtag, { ttl: STALE_CACHE_TTL }));
  }

  await Promise.all(cachePromises);

  // Update L1 cache (keeps this instance's memory cache warm)
  updateL1Cache(release);

  logger.info(`Cached GitHub release: ${release.tag_name}`);

  return release;
}

/**
 * Update the L1 memory cache with a release
 */
function updateL1Cache(release: GithubRelease): void {
  memoryCache.set(CACHE_KEY, release, L1_CACHE_TTL_MS);
}

export default defineEventHandler(async (event): Promise<GithubRelease> => {
  const cache = getCacheService();

  // Set HTTP cache headers for client-side caching
  setResponseHeaders(event, {
    'Cache-Control': `public, max-age=${CACHE_TTL.RELEASE_ID}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
  });

  // 1. Check L1 cache (in-memory, instant, no I/O)
  const l1Cached = memoryCache.get<GithubRelease>(CACHE_KEY);
  if (l1Cached) {
    logger.debug('L1 cache hit - returning in-memory data');
    return l1Cached;
  }

  // 2. Check L2 cache (Redis)
  const l2Cached = await cache.getItem<GithubRelease>(CACHE_KEY);
  if (l2Cached) {
    logger.debug('L2 cache hit - returning Redis data');
    updateL1Cache(l2Cached);
    return l2Cached;
  }

  // 3. Cache miss - try to acquire lock for fetching
  const lockAcquired = await acquireLock(LOCK_KEY, { ttlSeconds: 30 });

  if (!lockAcquired) {
    // Another instance is fetching, try to return stale data
    logger.debug('Lock busy - another instance is fetching');

    const stale = await cache.getItem<GithubRelease>(STALE_CACHE_KEY);
    if (stale) {
      logger.debug('Returning stale data while another instance refreshes');
      updateL1Cache(stale);
      return stale;
    }

    // No stale data available, wait briefly and retry L2 cache
    await new Promise(resolve => setTimeout(resolve, LOCK_WAIT_MS));

    const retryL2 = await cache.getItem<GithubRelease>(CACHE_KEY);
    if (retryL2) {
      updateL1Cache(retryL2);
      return retryL2;
    }

    // Still no data, throw error
    throw createError({
      statusCode: 503,
      statusMessage: 'Release data temporarily unavailable, please retry',
    });
  }

  // 4. We have the lock - fetch from GitHub (also updates L1 cache)
  try {
    return await fetchGithubRelease();
  }
  catch (error) {
    logger.error('Failed to fetch GitHub release:', error);

    // Try to return stale data if available
    const stale = await cache.getItem<GithubRelease>(STALE_CACHE_KEY);
    if (stale) {
      logger.warn(`Returning stale GitHub release data: ${stale.tag_name}`);
      updateL1Cache(stale);
      return stale;
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch release information from GitHub',
    });
  }
  finally {
    await releaseLock(LOCK_KEY);
  }
});
