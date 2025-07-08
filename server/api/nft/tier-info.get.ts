import type { TierInfoResult } from '~/composables/rotki-sponsorship/metadata';
import { ethers } from 'ethers';
import { z } from 'zod';
import { CONTRACT_ADDRESS, IPFS_URL, ROTKI_SPONSORSHIP_ABI, RPC_URL } from '~/composables/rotki-sponsorship/constants';
import { Multicall } from '~/server/utils/multicall';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-tier-info-api');

// Cache configuration
const TIER_DATA_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const METADATA_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const RELEASE_ID_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// In-memory cache implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class Cache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry)
      return null;

    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  clear(): void {
    this.cache.clear();
  }
}

// Initialize cache
const cache = new Cache();

// Singleton provider instance
let provider: ethers.JsonRpcProvider | null = null;
let contract: ethers.Contract | null = null;
let multicall: Multicall | null = null;
let contractInterface: ethers.Interface | null = null;

function getProvider(): ethers.JsonRpcProvider {
  if (!provider) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
  }
  return provider;
}

function getContract(): ethers.Contract {
  if (!contract) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, getProvider());
  }
  return contract;
}

function getMulticall(): Multicall {
  if (!multicall) {
    multicall = new Multicall(getProvider());
  }
  return multicall;
}

function getContractInterface(): ethers.Interface {
  if (!contractInterface) {
    contractInterface = new ethers.Interface(ROTKI_SPONSORSHIP_ABI);
  }
  return contractInterface;
}

// Request validation schema
const querySchema = z.object({
  tierIds: z.string().optional().transform((val) => {
    if (!val)
      return [];
    return val.split(',').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  }),
});

// Fetch metadata with caching
async function fetchMetadata(metadataURI: string): Promise<any> {
  const cacheKey = `metadata:${metadataURI}`;
  const cached = cache.get<any>(cacheKey);
  if (cached)
    return cached;

  let metadataUrl = metadataURI;
  if (metadataURI.startsWith('ipfs://')) {
    metadataUrl = `${IPFS_URL}${metadataURI.slice(7)}`;
  }

  const response = await fetch(metadataUrl);
  if (!response.ok) {
    throw new Error(`Metadata fetch error: ${response.status}`);
  }

  const metadata = await response.json();
  cache.set(cacheKey, metadata, METADATA_CACHE_TTL);
  return metadata;
}

// Get current release ID with caching
async function getCurrentReleaseId(): Promise<number> {
  const cacheKey = 'releaseId:current';
  const cached = cache.get<number>(cacheKey);
  if (cached !== null)
    return cached;

  const contract = getContract();
  const releaseId = await contract.currentReleaseId();
  const releaseIdNumber = Number(releaseId);

  cache.set(cacheKey, releaseIdNumber, RELEASE_ID_CACHE_TTL);
  return releaseIdNumber;
}

// Batch fetch tier info using multicall
async function fetchTierInfoBatch(tierIds: number[], releaseId: number): Promise<Record<number, TierInfoResult | null>> {
  const results: Record<number, TierInfoResult | null> = {};

  // Check cache first
  const uncachedTierIds: number[] = [];
  for (const tierId of tierIds) {
    const cacheKey = `tier:${releaseId}:${tierId}`;
    const cached = cache.get<TierInfoResult>(cacheKey);
    if (cached) {
      results[tierId] = cached;
    }
    else {
      uncachedTierIds.push(tierId);
    }
  }

  if (uncachedTierIds.length === 0) {
    return results;
  }

  try {
    // Prepare multicall
    const mc = getMulticall();
    const iface = getContractInterface();

    // Encode calls
    const calls = uncachedTierIds.map(tierId => ({
      allowFailure: true,
      callData: Multicall.encodeCall(iface, 'getTierInfo', [releaseId, tierId]),
      target: CONTRACT_ADDRESS,
    }));

    // Execute multicall
    const multicallResults = await mc.aggregate(calls);

    // Process results and fetch metadata in parallel
    const metadataPromises: Promise<void>[] = [];

    for (const [i, tierId] of uncachedTierIds.entries()) {
      const result = multicallResults[i];

      if (!result.success) {
        results[tierId] = null;
        continue;
      }

      try {
        const [maxSupply, currentSupply, metadataURI] = Multicall.decodeResult(
          iface,
          'getTierInfo',
          result.returnData,
        );

        if (!metadataURI) {
          results[tierId] = null;
          continue;
        }

        // Fetch metadata in parallel
        metadataPromises.push(
          fetchMetadata(metadataURI).then((metadata) => {
            // Extract image URL and convert to proxied URL
            let imageUrl = metadata.image;
            if (imageUrl) {
              // Use our image proxy endpoint to hide client IP
              imageUrl = `/api/nft/image?url=${encodeURIComponent(imageUrl)}`;
            }

            // Extract benefits
            const benefitsAttribute = metadata.attributes?.find((attr: any) => attr.trait_type === 'Benefits');
            const benefits = benefitsAttribute?.value || '';

            // Extract release name
            const releaseAttribute = metadata.attributes?.find((attr: any) =>
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

            const cacheKey = `tier:${releaseId}:${tierId}`;
            cache.set(cacheKey, tierInfo, TIER_DATA_CACHE_TTL);
            results[tierId] = tierInfo;
          }).catch((error) => {
            logger.error(`Error fetching metadata for tier ${tierId}:`, error);
            results[tierId] = null;
          }),
        );
      }
      catch (error) {
        logger.error(`Error decoding tier ${tierId} data:`, error);
        results[tierId] = null;
      }
    }

    // Wait for all metadata fetches to complete
    await Promise.all(metadataPromises);

    return results;
  }
  catch (error) {
    logger.error('Error in batch tier fetch:', error);
    // Fallback to individual fetches
    for (const tierId of uncachedTierIds) {
      results[tierId] = await fetchSingleTierInfo(tierId, releaseId);
    }
    return results;
  }
}

// Fetch single tier info with caching
async function fetchSingleTierInfo(tierId: number, releaseId: number): Promise<TierInfoResult | null> {
  const cacheKey = `tier:${releaseId}:${tierId}`;
  const cached = cache.get<TierInfoResult>(cacheKey);
  if (cached)
    return cached;

  try {
    const contract = getContract();
    const [maxSupply, currentSupply, metadataURI] = await contract.getTierInfo(releaseId, tierId);

    if (!metadataURI) {
      return null;
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
    const benefitsAttribute = metadata.attributes?.find((attr: any) => attr.trait_type === 'Benefits');
    const benefits = benefitsAttribute?.value || '';

    // Extract release name
    const releaseAttribute = metadata.attributes?.find((attr: any) =>
      attr.trait_type === 'Release' || attr.trait_type === 'Release Name',
    );
    const releaseName = releaseAttribute?.value || metadata.name || '';

    const result: TierInfoResult = {
      benefits,
      currentSupply: Number(currentSupply),
      description: metadata.description || '',
      imageUrl,
      maxSupply: Number(maxSupply),
      metadataURI,
      releaseName,
    };

    cache.set(cacheKey, result, TIER_DATA_CACHE_TTL);
    return result;
  }
  catch (error) {
    logger.error(`Error fetching tier ${tierId}:`, error);
    return null;
  }
}

export default defineEventHandler(async (event) => {
  try {
    // Validate query parameters
    const query = await getValidatedQuery(event, querySchema.parse);
    const { tierIds } = query;

    // Set cache headers
    setResponseHeaders(event, {
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      'Content-Type': 'application/json',
    });

    // If no specific tier IDs requested, return empty result
    if (!tierIds || tierIds.length === 0) {
      return {
        cached: false,
        releaseId: null,
        tiers: {},
      };
    }

    // Get current release ID
    const releaseId = await getCurrentReleaseId();

    // Check if we can use multicall for batch operations
    const useMulticall = tierIds.length > 1;

    let tiers: Record<number, TierInfoResult | null> = {};

    if (useMulticall) {
      // Use multicall for batch fetching
      tiers = await fetchTierInfoBatch(tierIds, releaseId);
    }
    else {
      // Single tier fetch
      const tierPromises = tierIds.map(async tierId =>
        fetchSingleTierInfo(tierId, releaseId).then(data => ({ data, tierId })),
      );

      const results = await Promise.all(tierPromises);

      // Build response object
      for (const { data, tierId } of results) {
        tiers[tierId] = data;
      }
    }

    return {
      cached: true,
      releaseId,
      tiers,
    };
  }
  catch (error) {
    logger.error('Error in tier-info endpoint:', error);
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch tier information',
    });
  }
});
