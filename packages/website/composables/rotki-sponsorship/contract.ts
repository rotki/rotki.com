import { get } from '@vueuse/shared';
import { ethers } from 'ethers';
import { useLogger } from '~/utils/use-logger';
import { useNftConfig } from './config';
import { CHAIN_CONFIGS, ROTKI_SPONSORSHIP_ABI } from './constants';
import { getRpcManager } from './rpc-checker';
import { SPONSORSHIP_TIERS, type TierSupply } from './types';

const logger = useLogger('rotki-sponsorship-contract');

/**
 * Factory for creating contract instances with RPC fallback
 */
export const ContractFactory = {
  /**
   * Create a contract instance
   * @param address Contract address
   * @param abi Contract ABI
   * @param providerOrSigner Provider or Signer instance
   * @returns Contract instance
   */
  createContract(address: string, abi: any[], providerOrSigner: ethers.Provider | ethers.Signer): ethers.Contract {
    return new ethers.Contract(address, abi, providerOrSigner);
  },

  /**
   * Create a Rotki Sponsorship contract instance
   * @param providerOrSigner Provider or Signer instance
   * @param contractAddress Contract address to use
   * @returns Contract instance
   */
  createRotkiSponsorshipContract(providerOrSigner: ethers.Provider | ethers.Signer, contractAddress: string): ethers.Contract {
    return this.createContract(contractAddress, ROTKI_SPONSORSHIP_ABI, providerOrSigner);
  },

  /**
   * Execute a contract operation with provider fallback
   * @param userProvider Optional provider from user wallet
   * @param contractCall Function that receives contract instance and returns result
   * @returns Promise with the contract call result
   */
  async executeWithContract<T>(
    contractCall: (contract: ethers.Contract) => Promise<T>,
    userProvider?: ethers.Provider,
  ): Promise<T> {
    const { CHAIN_ID, CONTRACT_ADDRESS } = useNftConfig();

    if (userProvider) {
      // Use provided provider (from user wallet)
      const contract = this.createRotkiSponsorshipContract(userProvider, get(CONTRACT_ADDRESS));
      return contractCall(contract);
    }
    else {
      // Use RPC manager with automatic fallback
      const chainId = get(CHAIN_ID);
      const chainConfig = Object.values(CHAIN_CONFIGS).find(config => config.chainId === chainId);
      if (!chainConfig) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const rpcManager = getRpcManager(chainId, chainConfig.rpcUrls);

      return rpcManager.executeWithFallback(async (ethersProvider) => {
        const contract = this.createRotkiSponsorshipContract(ethersProvider, get(CONTRACT_ADDRESS));
        return contractCall(contract);
      });
    }
  },

  /**
   * Get contract instance with a plain provider and explicit address (for server-side operations)
   * @param provider Provider instance
   * @param contractAddress Contract address to use
   * @returns Contract instance
   */
  getContractWithProvider(provider: ethers.Provider, contractAddress: string): ethers.Contract {
    return this.createRotkiSponsorshipContract(provider, contractAddress);
  },

  /**
   * Get contract instance with user provider or signer (for wallet operations)
   * @param providerOrSigner Provider or Signer from user wallet
   * @returns Contract instance connected to user provider/signer
   */
  getContractWithUserProvider(providerOrSigner: ethers.Provider | ethers.Signer): ethers.Contract {
    const { CONTRACT_ADDRESS } = useNftConfig();
    return this.createRotkiSponsorshipContract(providerOrSigner, get(CONTRACT_ADDRESS));
  },
};

export async function refreshSupplyData(provider?: ethers.Provider): Promise<Record<string, TierSupply>> {
  try {
    return await ContractFactory.executeWithContract(async (contract) => {
      const supplies: Record<string, TierSupply> = {};
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
    }, provider);
  }
  catch (error_) {
    logger.error('Error refreshing supply data:', error_);
    throw error_;
  }
}
