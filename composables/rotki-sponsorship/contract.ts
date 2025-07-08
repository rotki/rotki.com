import { get } from '@vueuse/shared';
import { ethers } from 'ethers';
import { useLogger } from '~/utils/use-logger';
import { useNftConfig } from './config';
import { ROTKI_SPONSORSHIP_ABI } from './constants';
import { SPONSORSHIP_TIERS, type TierSupply } from './types';

const logger = useLogger('rotki-sponsorship-contract');

export async function refreshSupplyData(provider?: ethers.Provider): Promise<Record<string, TierSupply>> {
  try {
    const { CONTRACT_ADDRESS, RPC_URL } = useNftConfig();
    const supplies: Record<string, TierSupply> = {};
    // Use provided provider or fall back to public RPC
    const ethersProvider = provider || new ethers.JsonRpcProvider(get(RPC_URL));
    const contract = new ethers.Contract(get(CONTRACT_ADDRESS), ROTKI_SPONSORSHIP_ABI, ethersProvider);
    const releaseId = await contract.currentReleaseId();

    for (const tier of SPONSORSHIP_TIERS) {
      const [maxSupply, currentSupply, metadataURI] = await contract.getTierInfo(releaseId, tier.tierId);
      supplies[tier.key] = {
        currentSupply: Number(currentSupply),
        maxSupply: Number(maxSupply),
        metadataURI,
      };
    }
    return supplies;
  }
  catch (error_) {
    logger.error('Error refreshing supply data:', error_);
    throw error_;
  }
}
