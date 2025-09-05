import type { NftConfig } from '~/composables/rotki-sponsorship/types';
import { CHAIN_CONFIGS } from '~/composables/rotki-sponsorship/constants';
import { SponsorshipMetadata } from '~/types/sponsor';
import { convertKeys } from '~/utils/object';
import { useLogger } from '~/utils/use-logger';

// Storage for detecting contract address changes
let lastContractAddress: string | undefined;

// For server-side usage (API endpoints)
export async function getServerNftConfig(): Promise<NftConfig> {
  const logger = useLogger('nft-config');
  try {
    const { baseUrl } = useRuntimeConfig().public;

    // Use the proxy utility to get the backend URL
    const apiUrl = `${baseUrl}/webapi/nfts/release/current/`;

    // Log the URL for debugging
    logger.debug('Fetching sponsorship metadata from:', apiUrl);

    // Fetch metadata from the API - this is public data, no auth needed
    const response = await $fetch<SponsorshipMetadata>(apiUrl, {
      parseResponse(responseText: string) {
        return convertKeys(JSON.parse(responseText), true, false);
      },
    });
    const { chain, contractAddress, releaseId } = SponsorshipMetadata.parse(response);

    const chainConfig = CHAIN_CONFIGS[chain];

    // Check if contract address has changed
    const hasContractChanged = lastContractAddress !== undefined && lastContractAddress !== contractAddress;
    if (hasContractChanged) {
      logger.warn(`Contract address changed from ${lastContractAddress} to ${contractAddress}`);
      // The cache will be automatically invalidated when defineCachedFunction
      // detects the key has changed (since we include contract address in cache keys)
    }
    lastContractAddress = contractAddress;

    return {
      CHAIN_ID: chainConfig.chainId,
      CONTRACT_ADDRESS: contractAddress,
      hasContractChanged,
      RELEASE_ID: releaseId,
    };
  }
  catch (error: any) {
    // Log the error for debugging
    logger.error('Failed to fetch NFT config metadata:', error?.data || error?.message || error);

    // Throw an error instead of using fallback values
    throw createError({
      statusCode: 503,
      statusMessage: 'NFT configuration service unavailable',
    });
  }
}
