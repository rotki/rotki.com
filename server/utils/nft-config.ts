import type { NftConfig } from '~/composables/rotki-sponsorship/types';
import { ethers } from 'ethers';
import {
  CHAIN_CONFIGS,
  FALLBACK_CHAIN,
  FALLBACK_CONTRACT_ADDRESS,
  ROTKI_SPONSORSHIP_ABI,
} from '~/composables/rotki-sponsorship/constants';
import { useLogger } from '~/utils/use-logger';

// Storage for detecting contract address changes
let lastContractAddress: string | undefined;

// For server-side usage (API endpoints)
export async function getServerNftConfig(): Promise<NftConfig> {
  const logger = useLogger('nft-config');
  try {
    const { baseUrl } = useRuntimeConfig().public;

    // Use the proxy utility to get the backend URL
    const apiUrl = `${baseUrl}/webapi/nfts/leaderboard/metadata/`;

    // Log the URL for debugging
    logger.debug('Fetching leaderboard metadata from:', apiUrl);

    // Fetch metadata from the API - this is public data, no auth needed
    const response = await $fetch<{
      contract_address: string;
      chain: 'sepolia' | 'ethereum';
    }>(apiUrl);

    const chainConfig = CHAIN_CONFIGS[response.chain];
    const currentAddress = response.contract_address;

    // Check if contract address has changed
    const hasContractChanged = lastContractAddress !== undefined && lastContractAddress !== currentAddress;
    if (hasContractChanged) {
      logger.warn(`Contract address changed from ${lastContractAddress} to ${currentAddress}`);
      // The cache will be automatically invalidated when defineCachedFunction
      // detects the key has changed (since we include contract address in cache keys)
    }
    lastContractAddress = currentAddress;

    return {
      CHAIN_ID: chainConfig.chainId,
      CONTRACT_ADDRESS: currentAddress,
      hasContractChanged,
      RPC_URL: chainConfig.rpcUrl,
    };
  }
  catch (error: any) {
    // Fallback to default values if metadata fetch fails
    logger.error('Failed to fetch NFT config metadata:', error?.data || error?.message || error);

    // Log more details about the error for debugging
    if (error?.status === 404) {
      logger.warn('Leaderboard metadata endpoint not found. Using fallback values.');
    }

    return {
      CHAIN_ID: CHAIN_CONFIGS[FALLBACK_CHAIN].chainId,
      CONTRACT_ADDRESS: FALLBACK_CONTRACT_ADDRESS,
      hasContractChanged: false,
      RPC_URL: CHAIN_CONFIGS[FALLBACK_CHAIN].rpcUrl,
    };
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
