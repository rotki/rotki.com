import type { TierBenefits, TierSupply } from './types';
import { get } from '@vueuse/shared';
import { ethers } from 'ethers';
import { useLogger } from '~/utils/use-logger';
import { useNftConfig } from './config';
import { IPFS_URL, ROTKI_SPONSORSHIP_ABI } from './constants';

const logger = useLogger('rotki-sponsorship-metadata');

export interface TierInfoResult {
  maxSupply: number;
  currentSupply: number;
  metadataURI: string;
  imageUrl: string;
  description: string;
  benefits: string;
  releaseName: string;
}

export async function fetchTierInfo(tierId: number, tierKey: string): Promise<TierInfoResult | undefined> {
  try {
    const { CONTRACT_ADDRESS, RPC_URL } = useNftConfig();
    const provider = new ethers.JsonRpcProvider(get(RPC_URL));
    const contract = new ethers.Contract(get(CONTRACT_ADDRESS), ROTKI_SPONSORSHIP_ABI, provider);

    const releaseId = await contract.currentReleaseId();
    const [maxSupply, currentSupply, metadataURI] = await contract.getTierInfo(releaseId, tierId);

    if (!metadataURI) {
      return undefined;
    }

    // Convert metadataURI (IPFS CID) to HTTP URL to fetch the JSON metadata
    let metadataUrl = metadataURI;
    if (metadataURI.startsWith('ipfs://')) {
      metadataUrl = `${IPFS_URL}${metadataURI.slice(7)}`;
    }

    // Fetch the metadata JSON
    const metadataResponse = await fetch(metadataUrl);
    if (!metadataResponse.ok) {
      throw new Error(`Metadata fetch error: ${metadataResponse.status}`);
    }

    const metadata = await metadataResponse.json();

    // Extract image URL from metadata.image
    let imageUrl = metadata.image;
    if (imageUrl && imageUrl.startsWith('ipfs://')) {
      imageUrl = `${IPFS_URL}${imageUrl.slice(7)}`;
    }

    // Extract benefits from attributes
    const benefitsAttribute = metadata.attributes?.find((attr: any) => attr.trait_type === 'Benefits');
    const benefits = benefitsAttribute?.value || '';

    // Extract release name from metadata attributes or name
    const releaseAttribute = metadata.attributes?.find((attr: any) => attr.trait_type === 'Release' || attr.trait_type === 'Release Name');
    const releaseNameFromMetadata = releaseAttribute?.value || metadata.name || '';

    return {
      benefits,
      currentSupply: Number(currentSupply),
      description: metadata.description || '',
      imageUrl,
      maxSupply: Number(maxSupply),
      metadataURI,
      releaseName: releaseNameFromMetadata,
    };
  }
  catch (error_) {
    logger.error(`Error fetching tier info for ${tierKey}:`, error_);
    return undefined;
  }
}

export async function loadNFTImagesAndSupply(tiers: { key: string; tierId: number }[]): Promise<{
  images: Record<string, string>;
  supplies: Record<string, TierSupply>;
  benefits: Record<string, TierBenefits>;
  releaseName: string;
}> {
  const images: Record<string, string> = {};
  const supplies: Record<string, TierSupply> = {};
  const benefits: Record<string, TierBenefits> = {};
  let releaseName = '';

  for (const tier of tiers) {
    const tierInfo = await fetchTierInfo(tier.tierId, tier.key);
    if (tierInfo) {
      images[tier.key] = tierInfo.imageUrl;
      supplies[tier.key] = {
        currentSupply: tierInfo.currentSupply,
        maxSupply: tierInfo.maxSupply,
        metadataURI: tierInfo.metadataURI,
      };
      benefits[tier.key] = {
        benefits: tierInfo.benefits,
        description: tierInfo.description,
      };
      if (tierInfo.releaseName && !releaseName) {
        releaseName = tierInfo.releaseName;
      }
    }
  }

  return { benefits, images, releaseName, supplies };
}
