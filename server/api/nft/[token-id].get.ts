import type { NftConfig } from '~/composables/rotki-sponsorship/types';
import { ethers } from 'ethers';
import { z } from 'zod';
import { IPFS_URL, ROTKI_SPONSORSHIP_ABI } from '~/composables/rotki-sponsorship/constants';
import { CACHE_TTL } from '~/server/utils/cache';
import { createNftTokenCacheKey } from '~/server/utils/cache-keys';
import { createCachedFunction } from '~/server/utils/cached-function';
import { handleApiError } from '~/server/utils/errors';
import { getServerNftConfig } from '~/server/utils/nft-config';
import { deduplicatedFetch } from '~/server/utils/request-dedup';
import { retryWithBackoff } from '~/server/utils/retry';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('nft-token-api');

// Request validation schema
const paramsSchema = z.object({
  'token-id': z.string().transform((val) => {
    const id = parseInt(val, 10);
    if (isNaN(id) || id < 0) {
      throw new Error('Invalid token ID');
    }
    return id;
  }),
});

interface TokenMetadata {
  tokenId: number;
  releaseId: number;
  tierId: number;
  owner: string;
  metadataURI: string;
  metadata: any;
  imageUrl?: string;
  tierName: 'bronze' | 'silver' | 'gold';
  releaseName: string;
}

/**
 * Create provider instance per request to avoid singleton issues
 */
function createProvider(rpcUrl: string): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Create contract instance per request
 */
function createContract(provider: ethers.JsonRpcProvider, contractAddress: string): ethers.Contract {
  return new ethers.Contract(contractAddress, ROTKI_SPONSORSHIP_ABI, provider);
}

// Fetch metadata with caching and deduplication
const fetchMetadata = createCachedFunction(async (metadataURI: string): Promise<any> => {
  const cacheKey = `metadata:${metadataURI}`;

  return deduplicatedFetch(cacheKey, async () => {
    let metadataUrl = metadataURI;
    if (metadataURI.startsWith('ipfs://')) {
      metadataUrl = `${IPFS_URL}${metadataURI.slice(7)}`;
    }

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
  getKey: (metadataURI: string) => `metadata:${metadataURI}`,
  maxAge: CACHE_TTL.METADATA,
  name: 'fetchTokenMetadata',
});

// Fetch token data from contract
async function fetchTokenDataDirect(tokenId: number, config: NftConfig): Promise<TokenMetadata | null> {
  try {
    const provider = createProvider(config.RPC_URL);
    const contract = createContract(provider, config.CONTRACT_ADDRESS);

    // First check if token exists by getting the owner
    let owner: string;
    try {
      owner = await contract.ownerOf(tokenId);
    }
    catch {
      logger.info(`Token ${tokenId} does not exist`);
      return null;
    }

    // Fetch token data in parallel
    const [releaseId, tierId, metadataURI] = await Promise.all([
      contract.tokenReleaseId(tokenId),
      contract.tokenTierId(tokenId),
      contract.tokenURI(tokenId),
    ]);

    logger.info(`Token ${tokenId} data:`, {
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
        const releaseAttribute = tierMetadata.attributes?.find((attr: any) =>
          attr.trait_type === 'Release' || attr.trait_type === 'Release Name',
        );
        releaseName = releaseAttribute?.value || '';

        logger.info(`Tier ${tierId} release name: ${releaseName}`);
      }
      catch (error) {
        logger.error(`Error fetching tier metadata for release name:`, error);
      }
    }

    // Map tier ID to name
    const tierNames: Record<number, 'bronze' | 'silver' | 'gold'> = {
      0: 'bronze',
      1: 'silver',
      2: 'gold',
    };

    return {
      imageUrl,
      metadata,
      metadataURI,
      owner,
      releaseId: Number(releaseId),
      releaseName,
      tierId: Number(tierId),
      tierName: tierNames[Number(tierId)] || 'bronze',
      tokenId,
    };
  }
  catch (error) {
    logger.error(`Error fetching token ${tokenId}:`, error);
    throw error;
  }
}

// Cached version of token data fetching
const fetchTokenData = createCachedFunction(fetchTokenDataDirect, {
  getKey: (tokenId: number, config: NftConfig) => createNftTokenCacheKey(config.CONTRACT_ADDRESS, tokenId),
  maxAge: CACHE_TTL.TIER_DATA,
  name: 'fetchTokenData',
});

export default defineEventHandler(async (event) => {
  try {
    // Validate parameters
    const params = await getValidatedRouterParams(event, data => paramsSchema.parse(data));
    const tokenId = params['token-id'];

    // Get config
    const config = await getServerNftConfig();

    // Check for cache busting parameter
    const query = getQuery(event);
    const skipCache = !!query._t;

    // Fetch token data
    const tokenData = skipCache
      ? await fetchTokenDataDirect(tokenId, config)
      : await fetchTokenData(tokenId, config);

    if (!tokenData) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Token not found',
      });
    }

    // Return simplified response for frontend
    return {
      metadata: {
        attributes: tokenData.metadata.attributes,
        description: tokenData.metadata.description,
        image: tokenData.imageUrl,
        name: tokenData.metadata.name,
      },
      owner: tokenData.owner,
      releaseId: tokenData.releaseId,
      releaseName: tokenData.releaseName,
      tier: tokenData.tierName,
      tierId: tokenData.tierId,
      tokenId: tokenData.tokenId,
    };
  }
  catch (error) {
    handleApiError(event, error);
  }
});
