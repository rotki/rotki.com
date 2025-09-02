import type { NftConfig, TierInfoResult, TierMetadata, TokenMetadata } from '~/composables/rotki-sponsorship/types';
import { findTierById, normalizeIpfsUrl } from '~/composables/rotki-sponsorship/utils';
import { CACHE_TTL } from '~/server/utils/cache';
import { createMetadataCacheKey, createNftCurrentReleaseIdKey, createTierCacheKey } from '~/server/utils/cache-keys';
import { clearCachedFunction, createCachedFunction } from '~/server/utils/cached-function';
import { Multicall } from '~/server/utils/multicall';
import { createContract, createProvider, getContractInterface, getServerNftConfig } from '~/server/utils/nft-config';
import { deduplicatedFetch } from '~/server/utils/request-dedup';
import { retryWithBackoff } from '~/server/utils/retry';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-core');

// Cache options for metadata
const metadataCacheOptions = {
  getKey: (metadataURI: string) => createMetadataCacheKey(metadataURI),
  maxAge: CACHE_TTL.METADATA,
  name: 'fetchMetadata',
};

// Fetch metadata with caching and deduplication
export const fetchMetadata = createCachedFunction(async (metadataURI: string): Promise<TierMetadata> => {
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
}, metadataCacheOptions);

// Cache options for release ID
const releaseIdCacheOptions = {
  getKey: (config: NftConfig) => createNftCurrentReleaseIdKey(config.CONTRACT_ADDRESS),
  maxAge: CACHE_TTL.RELEASE_ID,
  name: 'getCurrentReleaseId',
};

// Get current release ID with caching
export const getCurrentReleaseId = createCachedFunction(async (config: NftConfig): Promise<number> => deduplicatedFetch(`releaseId:${config.CONTRACT_ADDRESS}`, async () => {
  const provider = createProvider(config.RPC_URL);
  const contract = createContract(provider, config.CONTRACT_ADDRESS);
  const releaseId = await contract.currentReleaseId();
  return Number(releaseId);
}), releaseIdCacheOptions);

// Non-cached version of tier info fetching
export async function fetchSingleTierInfo(tierId: number, releaseId: number, config: NftConfig): Promise<TierInfoResult | undefined> {
  try {
    const provider = createProvider(config.RPC_URL);
    const contract = createContract(provider, config.CONTRACT_ADDRESS);
    const [maxSupply, currentSupply, metadataURI] = await contract.getTierInfo(releaseId, tierId);

    logger.info(`Contract getTierInfo response for tier ${tierId}, release ${releaseId}: currentSupply=${Number(currentSupply)}, maxSupply=${Number(maxSupply)}, metadataURI=${metadataURI}`);

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

// Cache options for tier info
const tierInfoCacheOptions = {
  getKey: (tierId: number, releaseId: number, config: NftConfig) => createTierCacheKey(config.CONTRACT_ADDRESS, releaseId, tierId),
  maxAge: CACHE_TTL.TIER_DATA,
  name: 'fetchCachedSingleTierInfo',
};

// Cached version of tier info fetching
export const fetchCachedSingleTierInfo = createCachedFunction(fetchSingleTierInfo, tierInfoCacheOptions);

// Batch fetch tier info using multicall
export async function fetchTierInfoBatch(tierIds: number[], releaseId: number, config: NftConfig, skipCache = false): Promise<Record<number, TierInfoResult | undefined>> {
  const results: Record<number, TierInfoResult | undefined> = {};

  // Check cache first by trying to fetch each tier
  const uncachedTierIds: number[] = [];
  const cachePromises = tierIds.map(async (tierId) => {
    if (skipCache) {
      // Clear cache for this tier when force refreshing
      await clearCachedFunction(tierInfoCacheOptions, tierId, releaseId, config);
      uncachedTierIds.push(tierId);
    }
    else {
      // Try to get from cache using the cached function
      try {
        const cached = await fetchCachedSingleTierInfo(tierId, releaseId, config);
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

  logger.debug(`Cache check complete. Cached: ${tierIds.length - uncachedTierIds.length}, Uncached: ${uncachedTierIds.length}`);

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
              imageUrl,
              maxSupply: Number(maxSupply),
              metadataURI,
              releaseName,
            };

            results[tierId] = tierInfo;

            // Cache the result using the cached function (it will update the cache)
            await fetchCachedSingleTierInfo(tierId, releaseId, config);
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
        results[tierId] = await fetchSingleTierInfo(tierId, releaseId, config);
      }
      catch (error) {
        logger.error(`Failed to fetch tier ${tierId}:`, error);
        results[tierId] = undefined;
      }
    }
  }

  return results;
}

// Clear caches
export async function clearReleaseIdCache(config: NftConfig): Promise<void> {
  await clearCachedFunction(releaseIdCacheOptions, config);
}

export async function clearTierInfoCache(tierId: number, releaseId: number, config: NftConfig): Promise<void> {
  await clearCachedFunction(tierInfoCacheOptions, tierId, releaseId, config);
}

// Get server NFT config with caching
let cachedConfig: NftConfig | undefined;

export async function getNftConfig(): Promise<NftConfig> {
  if (!cachedConfig) {
    cachedConfig = await getServerNftConfig();
  }
  return cachedConfig;
}

// Fetch token data from contract
export async function fetchTokenData(tokenId: number, config: NftConfig): Promise<TokenMetadata | null> {
  try {
    const provider = createProvider(config.RPC_URL);
    const contract = createContract(provider, config.CONTRACT_ADDRESS);

    // First check if token exists by getting the owner
    let owner: string;
    try {
      owner = await contract.ownerOf(tokenId);
    }
    catch {
      logger.warn(`Token ${tokenId} does not exist`);
      return null;
    }

    // Fetch token data in parallel
    const [releaseId, tierId, metadataURI] = await Promise.all([
      contract.tokenReleaseId(tokenId),
      contract.tokenTierId(tokenId),
      contract.tokenURI(tokenId),
    ]);

    logger.debug(`Token ${tokenId} data:`, {
      metadataURI,
      owner,
      releaseId: Number(releaseId),
      tierId: Number(tierId),
    });

    // Fetch metadata
    const metadata = await fetchMetadata(metadataURI);

    // Extract image URL and convert to proxied URL
    let imageUrl = metadata.image;
    if (imageUrl) {
      // Use our image proxy endpoint to hide client IP
      imageUrl = `/api/nft/image?url=${encodeURIComponent(imageUrl)}`;
    }

    // Fetch tier info to get the release name
    // The release name is stored in the tier metadata, not individual token metadata
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const [_tierMaxSupply, _tierCurrentSupply, tierMetadataURI] = await contract.getTierInfo(releaseId, tierId);

    let releaseName = '';
    if (tierMetadataURI) {
      try {
        const tierMetadata = await fetchMetadata(tierMetadataURI);
        const releaseAttribute = tierMetadata.attributes?.find(attr =>
          attr.trait_type === 'Release' || attr.trait_type === 'Release Name',
        );
        releaseName = releaseAttribute?.value || '';

        logger.debug(`Tier ${tierId} release name: ${releaseName}`);
      }
      catch (error) {
        logger.error(`Error fetching tier metadata for release name:`, error);
      }
    }

    return {
      imageUrl,
      metadata,
      metadataURI,
      owner,
      releaseId: Number(releaseId),
      releaseName,
      tierId: Number(tierId),
      tierName: findTierById(tierId)?.key || 'bronze',
      tokenId,
    };
  }
  catch (error) {
    logger.error(`Error fetching token ${tokenId}:`, error);
    throw error;
  }
}

// Cache options for token data
const tokenDataCacheOptions = {
  getKey: (tokenId: number, config: NftConfig) => `nft-token:${config.CONTRACT_ADDRESS}:${tokenId}`,
  maxAge: CACHE_TTL.TIER_DATA,
  name: 'fetchCachedTokenData',
};

// Cached version of token data fetching
export const fetchCachedTokenData = createCachedFunction(fetchTokenData, tokenDataCacheOptions);

// Clear token cache
export async function clearTokenDataCache(tokenId: number, config: NftConfig): Promise<void> {
  await clearCachedFunction(tokenDataCacheOptions, tokenId, config);
}
