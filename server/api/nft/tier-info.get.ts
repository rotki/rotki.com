import type { TierInfoResult } from '~/composables/rotki-sponsorship/metadata';
import { ethers } from 'ethers';
import { z } from 'zod';
import { CONTRACT_ADDRESS, IPFS_URL, ROTKI_SPONSORSHIP_ABI, RPC_URL } from '~/composables/rotki-sponsorship/constants';
import { CACHE_TTL } from '~/server/utils/cache';
import { Multicall } from '~/server/utils/multicall';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-tier-info-api');

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
const fetchMetadata = defineCachedFunction(async (metadataURI: string): Promise<any> => {
  let metadataUrl = metadataURI;
  if (metadataURI.startsWith('ipfs://')) {
    metadataUrl = `${IPFS_URL}${metadataURI.slice(7)}`;
  }

  const response = await fetch(metadataUrl);
  if (!response.ok) {
    throw new Error(`Metadata fetch error: ${response.status}`);
  }

  return response.json();
}, {
  getKey: (metadataURI: string) => `metadata:${metadataURI}`,
  maxAge: CACHE_TTL.METADATA,
  name: 'fetchMetadata',
});

// Get current release ID with caching
const getCurrentReleaseId = defineCachedFunction(async (): Promise<number> => {
  const contract = getContract();
  const releaseId = await contract.currentReleaseId();
  return Number(releaseId);
}, {
  getKey: () => 'releaseId:current',
  maxAge: CACHE_TTL.RELEASE_ID,
  name: 'getCurrentReleaseId',
});

// Cached function for fetching single tier info
const fetchSingleTierInfo = defineCachedFunction(async (tierId: number, releaseId: number): Promise<TierInfoResult | null> => {
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
    return null;
  }
}, {
  getKey: (tierId: number, releaseId: number) => `tier:${releaseId}:${tierId}`,
  maxAge: CACHE_TTL.TIER_DATA,
  name: 'fetchSingleTierInfo',
});

// Batch fetch tier info using multicall
async function fetchTierInfoBatch(tierIds: number[], releaseId: number): Promise<Record<number, TierInfoResult | null>> {
  const results: Record<number, TierInfoResult | null> = {};

  // Check cache first by trying to fetch each tier
  const uncachedTierIds: number[] = [];
  const cachePromises = tierIds.map(async (tierId) => {
    // Try to get from cache using the cached function
    try {
      const cached = await fetchSingleTierInfo(tierId, releaseId);
      if (cached !== null) {
        results[tierId] = cached;
      }
      else {
        uncachedTierIds.push(tierId);
      }
    }
    catch {
      uncachedTierIds.push(tierId);
    }
  });

  await Promise.all(cachePromises);

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
          fetchMetadata(metadataURI).then(async (metadata) => {
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

            results[tierId] = tierInfo;
            // Cache will be handled by the defineCachedFunction when called next time
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
      const tierPromises = tierIds.map(async (tierId) => {
        const data = await fetchSingleTierInfo(tierId, releaseId);
        return { data, tierId };
      });

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
