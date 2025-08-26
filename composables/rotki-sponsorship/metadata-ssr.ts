import type { TierBenefits, TierInfoResult, TierSupply } from './types';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('rotki-sponsorship-metadata-ssr');

interface TierInfoResponse {
  tiers: Record<number, TierInfoResult | undefined>;
  releaseId: number | undefined;
}

/**
 * SSR-compatible version of fetchTierInfo that uses the server API
 */
export async function fetchTierInfoSSR(tierId: number, tierKey: string): Promise<TierInfoResult | undefined> {
  try {
    const response = await $fetch<TierInfoResponse>('/api/nft/tier-info', {
      params: {
        tierIds: tierId.toString(),
      },
    });

    return response.tiers[tierId];
  }
  catch (error) {
    logger.error(`Error fetching tier info for ${tierKey}:`, error);
    return undefined;
  }
}

/**
 * SSR-compatible version of loadNFTImagesAndSupply that uses the server API
 */
export async function loadNFTImagesAndSupplySSR(tiers: { key: string; tierId: number }[], forceRefresh = false): Promise<{
  images: Record<string, string>;
  supplies: Record<string, TierSupply>;
  benefits: Record<string, TierBenefits>;
  releaseName: string;
  releaseId: number | undefined;
}> {
  const images: Record<string, string> = {};
  const supplies: Record<string, TierSupply> = {};
  const benefits: Record<string, TierBenefits> = {};
  let releaseName = '';
  let releaseId: number | undefined;

  if (tiers.length === 0) {
    return { benefits, images, releaseId: undefined, releaseName, supplies };
  }

  try {
    // Batch fetch all tiers at once
    const tierIds = tiers.map(t => t.tierId).join(',');
    const params: Record<string, string> = {
      tierIds,
    };

    // Add timestamp to force cache bypass when needed
    if (forceRefresh) {
      params.skipCache = 'true';
    }

    const response = await $fetch<TierInfoResponse>('/api/nft/tier-info', {
      params,
    });

    // Store the releaseId from the response
    releaseId = response.releaseId;

    // Process the results
    for (const tier of tiers) {
      const tierInfo = response.tiers[tier.tierId];
      if (tierInfo) {
        images[tier.key] = tierInfo.imageUrl;
        supplies[tier.key] = {
          currentSupply: tierInfo.currentSupply,
          maxSupply: tierInfo.maxSupply,
          metadataURI: tierInfo.metadataURI,
        };
        benefits[tier.key] = {
          benefits: tierInfo.benefits,
        };
        if (tierInfo.releaseName && !releaseName) {
          releaseName = tierInfo.releaseName;
        }
      }
    }
  }
  catch (error) {
    logger.error('Error batch fetching tier info:', error);

    // Fallback to individual fetches if batch fails
    for (const tier of tiers) {
      const tierInfo = await fetchTierInfoSSR(tier.tierId, tier.key);
      if (tierInfo) {
        images[tier.key] = tierInfo.imageUrl;
        supplies[tier.key] = {
          currentSupply: tierInfo.currentSupply,
          maxSupply: tierInfo.maxSupply,
          metadataURI: tierInfo.metadataURI,
        };
        benefits[tier.key] = {
          benefits: tierInfo.benefits,
        };
        if (tierInfo.releaseName && !releaseName) {
          releaseName = tierInfo.releaseName;
        }
      }
    }
  }

  return { benefits, images, releaseId, releaseName, supplies };
}
