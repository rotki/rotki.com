import type {
  NftConfig,
  TierMetadata,
  TokenMetadata,
} from '~/composables/rotki-sponsorship/types';
import { z } from 'zod';
import { findTierById, normalizeIpfsUrl } from '~/composables/rotki-sponsorship/utils';
import { CACHE_TTL } from '~/server/utils/cache';
import { createNftTokenCacheKey } from '~/server/utils/cache-keys';
import { createCachedFunction } from '~/server/utils/cached-function';
import { handleApiError } from '~/server/utils/errors';
import { createContract, createProvider, getServerNftConfig } from '~/server/utils/nft-config';
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

// Fetch metadata with caching and deduplication
const fetchMetadata = createCachedFunction(async (metadataURI: string): Promise<TierMetadata> => {
  const cacheKey = `metadata:${metadataURI}`;

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
        const releaseAttribute = tierMetadata.attributes?.find(attr =>
          attr.trait_type === 'Release' || attr.trait_type === 'Release Name',
        );
        releaseName = releaseAttribute?.value || '';

        logger.info(`Tier ${tierId} release name: ${releaseName}`);
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

// Cached version of token data fetching
const fetchTokenData = createCachedFunction(fetchTokenDataDirect, {
  getKey: (tokenId: number, config: NftConfig) => createNftTokenCacheKey(config.CONTRACT_ADDRESS, tokenId),
  maxAge: CACHE_TTL.TIER_DATA,
  name: 'fetchTokenData',
});

export default defineEventHandler(async (event): Promise<TokenMetadata> => {
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

    return tokenData;
  }
  catch (error) {
    handleApiError(event, error);
  }
});
