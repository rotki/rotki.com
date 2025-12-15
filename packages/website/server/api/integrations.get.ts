import type { IntegrationData, IntegrationItem } from '~/types/integrations';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { useLogger } from '#shared/utils/use-logger';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { CACHE_TTL } from '~~/server/utils/cache';
import { getCacheService } from '~~/server/utils/cache-service';

const CACHE_KEY = 'integrations:data';
const STALE_CACHE_KEY = 'integrations:data:stale';
const STALE_CACHE_TTL = 7 * 24 * 60 * 60; // 7 days stale fallback
const STALE_WHILE_REVALIDATE = 24 * 60 * 60; // 24 hours

const GITHUB_IMAGE_BASE = 'https://raw.githubusercontent.com/rotki/rotki/develop/frontend/app/public/assets/images/protocols/';

const logger = useLogger('integrations-api');

/**
 * Load local fallback data from the bundled JSON file
 */
function loadLocalFallback(): IntegrationData | undefined {
  try {
    // In production, the file is in the .output/public directory
    const filePath = resolve(process.cwd(), 'public/integrations/all.json');
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as IntegrationData;
  }
  catch (error) {
    logger.error('Failed to load local fallback:', error);
    return undefined;
  }
}

interface ExchangeIntegrationItem extends IntegrationItem {
  isExchangeWithKey?: boolean;
}

/**
 * Transform image URLs to use the /integrations/ alias
 * This decouples the data from the specific GitHub URL
 */
function transformImageUrls(data: IntegrationData): IntegrationData {
  const transformItem = <T extends IntegrationItem>(item: T): T => ({
    ...item,
    image: item.image.replace(GITHUB_IMAGE_BASE, '/integrations/'),
  });

  return {
    blockchains: data.blockchains.map(transformItem),
    exchanges: data.exchanges.map(item => transformItem(item as ExchangeIntegrationItem)),
    protocols: data.protocols.map(transformItem),
  };
}

export default defineEventHandler(async (event): Promise<IntegrationData> => {
  const cache = getCacheService();
  const { testing } = useRuntimeConfig().public;
  const branch = testing ? 'develop' : 'main';
  const githubUrl = `https://raw.githubusercontent.com/rotki/rotki.com/${branch}/packages/website/public/integrations/all.json`;

  // Set HTTP cache headers
  setResponseHeaders(event, {
    'Cache-Control': `public, max-age=${CACHE_TTL.INTEGRATIONS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`,
  });

  // Check cache first
  const cached = await cache.getItem<IntegrationData>(CACHE_KEY);
  if (cached) {
    logger.debug('Returning cached integrations data');
    return cached;
  }

  // Fetch from GitHub
  try {
    logger.info('Fetching integrations from GitHub');
    const response = await $fetch<string>(githubUrl, { responseType: 'text' });
    const rawData = convertKeys(JSON.parse(response), true, false) as IntegrationData;
    const data = transformImageUrls(rawData);

    // Cache with TTL
    await cache.setItem(CACHE_KEY, data, { ttl: CACHE_TTL.INTEGRATIONS });
    await cache.setItem(STALE_CACHE_KEY, data, { ttl: STALE_CACHE_TTL });

    logger.info('Integrations data cached successfully');
    return data;
  }
  catch (error) {
    logger.error('Failed to fetch integrations:', error);

    // Fallback 1: Stale cache
    const stale = await cache.getItem<IntegrationData>(STALE_CACHE_KEY);
    if (stale) {
      logger.warn('Returning stale integrations data');
      return stale;
    }

    // Fallback 2: Local bundled JSON file
    const local = loadLocalFallback();
    if (local) {
      logger.warn('Returning local fallback integrations data');
      // Transform and cache the local data
      const data = transformImageUrls(local);
      await cache.setItem(CACHE_KEY, data, { ttl: CACHE_TTL.INTEGRATIONS });
      return data;
    }

    throw createError({
      statusCode: 502,
      statusMessage: 'Failed to fetch integrations from GitHub',
    });
  }
});
