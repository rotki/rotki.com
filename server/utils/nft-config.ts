import type { NftConfig } from '~/composables/rotki-sponsorship/types';
import { ethers } from 'ethers';
import {
  CHAIN_CONFIGS,
  ROTKI_SPONSORSHIP_ABI,
} from '~/composables/rotki-sponsorship/constants';
import { getWorkingRpcUrl } from '~/composables/rotki-sponsorship/rpc-checker';
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

    // Find a working RPC URL
    const workingRpcUrl = await getWorkingRpcUrl(chainConfig.rpcUrls);

    return {
      CHAIN_ID: chainConfig.chainId,
      CONTRACT_ADDRESS: contractAddress,
      hasContractChanged,
      RELEASE_ID: releaseId,
      RPC_URL: workingRpcUrl,
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

/**
 * Create provider instance per request to avoid singleton issues
 */
export function createProvider(rpcUrl: string): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(rpcUrl);
}

/**
 * Create contract instance per request
 */
export function createContract(provider: ethers.JsonRpcProvider, contractAddress: string): ethers.Contract {
  return new ethers.Contract(contractAddress, ROTKI_SPONSORSHIP_ABI, provider);
}

/**
 * Get contract interface (this can be cached as it's stateless)
 */
export const getContractInterface = (() => {
  let iface: ethers.Interface | undefined;
  return () => {
    if (!iface) {
      iface = new ethers.Interface(ROTKI_SPONSORSHIP_ABI);
    }
    return iface;
  };
})();
