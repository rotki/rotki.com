import { ethers } from 'ethers';
import { useLogger } from '~/utils/use-logger';
import { CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, RPC_URL, USDC_ADDRESS } from './constants';
import { SPONSORSHIP_TIERS, type TierSupply } from './types';

const logger = useLogger('rotki-sponsorship-contract');

export async function checkPaymentTokenEnabled(tokenAddress: string): Promise<boolean> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);

    const isEnabled = await contract.paymentTokensEnabled(tokenAddress);
    logger.info(`Payment token ${tokenAddress} enabled: ${isEnabled}`);
    return isEnabled;
  }
  catch (error_) {
    logger.error(`Error checking if payment token is enabled for ${tokenAddress}:`, error_);
    return false;
  }
}

export async function fetchTierPrices(): Promise<Record<string, Record<string, string>>> {
  try {
    const prices: Record<string, Record<string, string>> = {};
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);

    for (const tier of SPONSORSHIP_TIERS) {
      const ethPrice = await contract.getPrice(tier.tierId, '0x0000000000000000000000000000000000000000');
      const usdcPrice = await contract.getPrice(tier.tierId, USDC_ADDRESS);
      prices[tier.key] = {
        ETH: ethers.formatEther(ethPrice),
        USDC: ethers.formatUnits(usdcPrice, 6),
      };
    }
    return prices;
  }
  catch (error_) {
    logger.error('Error fetching tier prices:', error_);
    throw error_;
  }
}

export async function refreshSupplyData(): Promise<Record<string, TierSupply>> {
  try {
    const supplies: Record<string, TierSupply> = {};
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ROTKI_SPONSORSHIP_ABI, provider);
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
