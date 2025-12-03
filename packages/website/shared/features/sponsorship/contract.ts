import { CHAIN_CONFIGS, ROTKI_SPONSORSHIP_ABI } from '#shared/features/sponsorship/constants';
import { getRpcManager } from '#shared/features/sponsorship/rpc-checker';
import { SPONSORSHIP_TIERS, type TierSupply } from '#shared/features/sponsorship/types';
import { useLogger } from '#shared/utils/use-logger';
import { ethers } from 'ethers';

const logger = useLogger('rotki-sponsorship-contract');

/**
 * Factory for creating contract instances with RPC fallback
 * This is a shared version that doesn't depend on Vue composables
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
   * Get contract instance with a plain provider and explicit address (for server-side operations)
   * @param provider Provider instance
   * @param contractAddress Contract address to use
   * @returns Contract instance
   */
  getContractWithProvider(provider: ethers.Provider, contractAddress: string): ethers.Contract {
    return this.createRotkiSponsorshipContract(provider, contractAddress);
  },

  /**
   * Execute a contract operation with provider fallback using explicit config (for server-side operations)
   * @param chainId Chain ID
   * @param contractAddress Contract address
   * @param contractCall Function that receives contract instance and returns result
   * @returns Promise with the contract call result
   */
  async executeWithContractAndConfig<T>(
    chainId: number,
    contractAddress: string,
    contractCall: (contract: ethers.Contract) => Promise<T>,
  ): Promise<T> {
    const chainConfig = Object.values(CHAIN_CONFIGS).find(config => config.chainId === chainId);
    if (!chainConfig) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }

    const rpcManager = getRpcManager(chainId, chainConfig.rpcUrls);

    return rpcManager.executeWithFallback(async (ethersProvider) => {
      const contract = this.createRotkiSponsorshipContract(ethersProvider, contractAddress);
      return contractCall(contract);
    });
  },
};

/**
 * Refresh supply data using explicit config (for server-side operations)
 */
export async function refreshSupplyDataWithConfig(
  chainId: number,
  contractAddress: string,
): Promise<Record<string, TierSupply>> {
  try {
    return await ContractFactory.executeWithContractAndConfig(chainId, contractAddress, async (contract) => {
      const supplies: Record<string, TierSupply> = {};
      const releaseId = await contract.currentReleaseId?.();

      for (const tier of SPONSORSHIP_TIERS) {
        const [maxSupply, currentSupply, metadataURI] = await contract.getTierInfo?.(releaseId, tier.tierId) ?? [0, 0, ''];
        supplies[tier.key] = {
          currentSupply: Number(currentSupply),
          maxSupply: Number(maxSupply),
          metadataURI,
        };
      }
      return supplies;
    });
  }
  catch (error_) {
    logger.error('Error refreshing supply data:', error_);
    throw error_;
  }
}
