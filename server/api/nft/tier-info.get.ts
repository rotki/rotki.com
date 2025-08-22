import type { NftConfig, TierInfoResult, TierMetadata } from '~/composables/rotki-sponsorship/types';
import { z } from 'zod';
import { normalizeIpfsUrl } from '~/composables/rotki-sponsorship/utils';
import { CACHE_TTL } from '~/server/utils/cache';
import { createMetadataCacheKey, createNftCurrentReleaseIdKey, createTierCacheKey } from '~/server/utils/cache-keys';
import { createCachedFunction } from '~/server/utils/cached-function';
import { handleApiError } from '~/server/utils/errors';
import { Multicall } from '~/server/utils/multicall';
import { createContract, createProvider, getContractInterface, getServerNftConfig } from '~/server/utils/nft-config';
import { deduplicatedFetch } from '~/server/utils/request-dedup';
import { retryWithBackoff } from '~/server/utils/retry';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-tier-info-api');

// Request validation schema
const querySchema = z.object({
  _t: z.string().optional(), // Timestamp for cache busting
  tierIds: z.string().optional().transform((val) => {
    if (!val)
      return [];
    return val.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  }),
});

// Fetch metadata with caching and deduplication
const fetchMetadata = createCachedFunction(async (metadataURI: string): Promise<TierMetadata> => {
  const cacheKey = createMetadataCacheKey(metadataURI);

  return deduplicatedFetch(cacheKey, async () => {
    const metadataUrl = normalizeIpfsUrl(metadataURI);

    const response = await retryWithBackoff(async () => {
      const res = await fetch(metadataUrl);
      if (!res.ok) {
        const error = new Error(`Metadata fetch error: ${res.status}`);
        (error as any).status = res.status;
        throw error;
      }
      return res;
    }, {
      initialDelay: 500,
      maxRetries: 3,
    });

    return response.json();
  });
}, {
  getKey: (metadataURI: string) => createMetadataCacheKey(metadataURI),
  maxAge: CACHE_TTL.METADATA,
  name: 'fetchMetadata',
});

// Get current release ID with caching
const getCurrentReleaseId = createCachedFunction(async (config: NftConfig): Promise<number> => deduplicatedFetch(`releaseId:${config.CONTRACT_ADDRESS}`, async () => {
  const provider = createProvider(config.RPC_URL);
  const contract = createContract(provider, config.CONTRACT_ADDRESS);
  const releaseId = await contract.currentReleaseId();
  return Number(releaseId);
}), {
  getKey: config => createNftCurrentReleaseIdKey(config.CONTRACT_ADDRESS),
  maxAge: CACHE_TTL.RELEASE_ID,
  name: 'getCurrentReleaseId',
});

// Non-cached version of tier info fetching
async function fetchSingleTierInfoDirect(tierId: number, releaseId: number, config: NftConfig): Promise<TierInfoResult | undefined> {
  try {
    const provider = createProvider(config.RPC_URL);
    const contract = createContract(provider, config.CONTRACT_ADDRESS);
    const [maxSupply, currentSupply, metadataURI] = await contract.getTierInfo(releaseId, tierId);

    logger.info(`Contract getTierInfo response for tier ${tierId}, release ${releaseId}:`, {
      currentSupply: Number(currentSupply),
      maxSupply: Number(maxSupply),
      metadataURI,
      releaseId,
      tierId,
    });

    if (!metadataURI) {
      return undefined;
    }

    // Fetch metadata (with its own caching)
    const metadata = await fetchMetadata(metadataURI);

    // Extract image URL and convert to proxied URL
    let imageUrl = metadata.image;
    if (imageUrl) {
      // Use our image proxy endpoint to hide client IP
      imageUrl = `/api/nft/image?url=${encodeURIComponent(imageUrl)}`;
    }

    // Extract benefits
    const benefitsAttribute = metadata.attributes?.find(attr => attr.trait_type === 'Benefits');
    const benefits = benefitsAttribute?.value || '';

    // Extract release name
    const releaseAttribute = metadata.attributes?.find(attr =>
      attr.trait_type === 'Release' || attr.trait_type === 'Release Name',
    );
    const releaseName = releaseAttribute?.value || metadata.name || '';

    return {
      benefits,
      currentSupply: Number(currentSupply),
      description: metadata.description || '',
      imageUrl,
      maxSupply: Number(maxSupply),
      metadataURI,
      releaseName,
    };
  }
  catch (error) {
    logger.error(`Error fetching tier ${tierId}:`, error);
    return undefined;
  }
}

// Cached version of tier info fetching
const fetchSingleTierInfo = createCachedFunction(fetchSingleTierInfoDirect, {
  getKey: (tierId: number, releaseId: number, config: NftConfig) => createTierCacheKey(config.CONTRACT_ADDRESS, releaseId, tierId),
  maxAge: CACHE_TTL.TIER_DATA,
  name: 'fetchSingleTierInfo',
});

// Batch fetch tier info using multicall
async function fetchTierInfoBatch(tierIds: number[], releaseId: number, config: NftConfig, skipCache = false): Promise<Record<number, TierInfoResult | undefined>> {
  const results: Record<number, TierInfoResult | undefined> = {};

  // Check cache first by trying to fetch each tier
  const uncachedTierIds: number[] = [];
  const cachePromises = tierIds.map(async (tierId) => {
    if (skipCache) {
      // Skip cache when force refreshing
      uncachedTierIds.push(tierId);
    }
    else {
      // Try to get from cache using the cached function
      try {
        const cached = await fetchSingleTierInfo(tierId, releaseId, config);
        if (cached !== undefined) {
          results[tierId] = cached;
        }
        else {
          uncachedTierIds.push(tierId);
        }
      }
      catch {
        uncachedTierIds.push(tierId);
      }
    }
  });

  await Promise.all(cachePromises);

  logger.info(`Cache check complete. Cached: ${tierIds.length - uncachedTierIds.length}, Uncached: ${uncachedTierIds.length}`);

  // If all tiers are cached, return early
  if (uncachedTierIds.length === 0) {
    return results;
  }

  // Batch fetch uncached tiers using multicall
  try {
    const provider = createProvider(config.RPC_URL);
    const multicall = new Multicall(provider);
    const contract = createContract(provider, config.CONTRACT_ADDRESS);
    const iface = getContractInterface();

    // Prepare multicall
    const calls = uncachedTierIds.map(tierId => ({
      callData: iface.encodeFunctionData('getTierInfo', [releaseId, tierId]),
      target: contract.target as string,
    }));

    // Execute multicall
    const multicallResults = await multicall.aggregate(calls);

    // Process results and fetch metadata in parallel
    const metadataPromises: Promise<void>[] = [];

    for (const [i, tierId] of uncachedTierIds.entries()) {
      const result = multicallResults[i];

      if (!result.success) {
        results[tierId] = undefined;
        continue;
      }

      try {
        const [maxSupply, currentSupply, metadataURI] = Multicall.decodeResult(
          iface,
          'getTierInfo',
          result.returnData,
        );

        if (!metadataURI) {
          results[tierId] = undefined;
          continue;
        }

        // Fetch metadata in parallel
        metadataPromises.push(
          fetchMetadata(metadataURI).then(async (metadata) => {
            // Extract image URL and convert to proxied URL
            let imageUrl = metadata.image;
            if (imageUrl) {
              // Use our image proxy endpoint to hide client IP
              imageUrl = `/api/nft/image?url=${encodeURIComponent(imageUrl)}`;
            }

            // Extract benefits
            const benefitsAttribute = metadata.attributes?.find(attr => attr.trait_type === 'Benefits');
            const benefits = benefitsAttribute?.value || '';

            // Extract release name
            const releaseAttribute = metadata.attributes?.find(attr =>
              attr.trait_type === 'Release' || attr.trait_type === 'Release Name',
            );
            const releaseName = releaseAttribute?.value || metadata.name || '';

            const tierInfo: TierInfoResult = {
              benefits,
              currentSupply: Number(currentSupply),
              description: metadata.description || '',
              imageUrl,
              maxSupply: Number(maxSupply),
              metadataURI,
              releaseName,
            };

            results[tierId] = tierInfo;

            // Cache the result if not skipping cache
            if (!skipCache) {
              await fetchSingleTierInfo(tierId, releaseId, config);
            }
          }).catch((error) => {
            logger.error(`Failed to fetch metadata for tier ${tierId}:`, error);
            results[tierId] = undefined;
          }),
        );
      }
      catch (error) {
        logger.error(`Failed to decode tier info for tier ${tierId}:`, error);
        results[tierId] = undefined;
      }
    }

    // Wait for all metadata fetches to complete
    await Promise.all(metadataPromises);
  }
  catch (error) {
    logger.error('Multicall failed:', error);
    // Fallback to individual fetches if multicall fails
    for (const tierId of uncachedTierIds) {
      try {
        results[tierId] = await fetchSingleTierInfoDirect(tierId, releaseId, config);
      }
      catch (error) {
        logger.error(`Failed to fetch tier ${tierId}:`, error);
        results[tierId] = undefined;
      }
    }
  }

  return results;
}

export default defineEventHandler(async (event) => {
  try {
    // Validate query parameters
    const query = await getValidatedQuery(event, data => querySchema.parse(data));
    const { _t, tierIds } = query;

    // If no specific tier IDs requested, return empty result
    if (!tierIds || tierIds.length === 0) {
      return {
        cached: false,
        releaseId: undefined,
        tiers: {},
      };
    }

    // Get config once at the beginning of the request
    const config = await getServerNftConfig();

    // Get current release ID
    const releaseId = await getCurrentReleaseId(config);
    logger.info(`Current release ID: ${releaseId}`);

    // Check if we can use multicall for batch operations
    const useMulticall = tierIds.length > 1;

    let tiers: Record<number, TierInfoResult | undefined> = {};

    if (useMulticall) {
      // Use multicall for batch fetching
      tiers = await fetchTierInfoBatch(tierIds, releaseId, config, !!_t);
    }
    else {
      // Single tier fetch
      const tierPromises = tierIds.map(async (tierId) => {
        // Use direct fetch when cache busting, otherwise use cached version
        const data = _t
          ? await fetchSingleTierInfoDirect(tierId, releaseId, config)
          : await fetchSingleTierInfo(tierId, releaseId, config);
        return { data, tierId };
      });

      const results = await Promise.all(tierPromises);
      for (const { data, tierId } of results) {
        tiers[tierId] = data;
      }
    }

    return {
      cached: !_t, // If _t is provided, we're bypassing cache
      releaseId,
      tiers,
    };
  }
  catch (error) {
    handleApiError(event, error);
  }
});
