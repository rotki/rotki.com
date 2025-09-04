import type { TierInfoResult } from './types';
import { get } from '@vueuse/shared';
import { ethers } from 'ethers';
import { normalizeIpfsUrl } from '~/composables/rotki-sponsorship/utils';
import { useLogger } from '~/utils/use-logger';
import { useNftConfig } from './config';
import { CHAIN_CONFIGS, ROTKI_SPONSORSHIP_ABI } from './constants';
import { getRpcManager } from './rpc-checker';

const logger = useLogger('rotki-sponsorship-metadata');

export async function fetchTierInfo(tierId: number, tierKey: string): Promise<TierInfoResult | undefined> {
  try {
    const { CHAIN_ID, CONTRACT_ADDRESS } = useNftConfig();
    const contractAddress = get(CONTRACT_ADDRESS);
    const chainId = get(CHAIN_ID);

    // Get chain config to access RPC URLs
    const chainConfig = Object.values(CHAIN_CONFIGS).find(config => config.chainId === chainId);
    if (!chainConfig) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    // Get singleton RPC manager for this chain
    const rpcManager = getRpcManager(chainId, chainConfig.rpcUrls);

    // Execute contract calls with automatic RPC fallback
    const result = await rpcManager.executeWithFallback(async (provider: ethers.JsonRpcProvider) => {
      const contract = new ethers.Contract(contractAddress, ROTKI_SPONSORSHIP_ABI, provider);

      // Get release ID and tier info
      const releaseId = await contract.currentReleaseId();
      const [maxSupply, currentSupply, metadataURI] = await contract.getTierInfo(releaseId, tierId);

      return {
        currentSupply: Number(currentSupply),
        maxSupply: Number(maxSupply),
        metadataURI: metadataURI as string,
      };
    });

    if (!result.metadataURI) {
      logger.warn(`No metadata URI found for tier ${tierKey} (ID: ${tierId})`);
      return undefined;
    }

    // Fetch metadata with retries
    let metadata: any;
    try {
      const metadataUrl = normalizeIpfsUrl(result.metadataURI);

      // Retry metadata fetch with exponential backoff
      let retries = 3;
      let delay = 1000;

      while (retries > 0) {
        try {
          const metadataResponse = await fetch(metadataUrl);
          if (!metadataResponse.ok) {
            throw new Error(`Metadata fetch error: ${metadataResponse.status}`);
          }
          metadata = await metadataResponse.json();
          break;
        }
        catch (error: any) {
          retries--;
          if (retries === 0) {
            throw error;
          }
          logger.debug(`Metadata fetch failed, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }
    catch (error: any) {
      logger.error(`Failed to fetch metadata for tier ${tierKey}:`, error?.message);
      throw error;
    }

    // Extract image URL from metadata.image
    const imageUrl = normalizeIpfsUrl(metadata.image);

    // Extract benefits from attributes
    const benefitsAttribute = metadata.attributes?.find((attr: any) => attr.trait_type === 'Benefits');
    const benefits = benefitsAttribute?.value || '';

    // Extract release name from metadata attributes or name
    const releaseAttribute = metadata.attributes?.find((attr: any) => attr.trait_type === 'Release' || attr.trait_type === 'Release Name');
    const releaseNameFromMetadata = releaseAttribute?.value || metadata.name || '';

    return {
      benefits,
      currentSupply: result.currentSupply,
      imageUrl,
      maxSupply: result.maxSupply,
      metadataURI: result.metadataURI,
      releaseName: releaseNameFromMetadata,
    };
  }
  catch (error_) {
    logger.error(`Error fetching tier info for ${tierKey}:`, error_);
    return undefined;
  }
}
