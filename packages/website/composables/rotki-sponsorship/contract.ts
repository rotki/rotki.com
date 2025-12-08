import type { Contract, Provider, Signer } from 'ethers';
import { get } from '@vueuse/shared';
import { useLogger } from '~/utils/use-logger';
import { CHAIN_CONFIGS, ROTKI_SPONSORSHIP_ABI } from './constants';
import { SPONSORSHIP_TIERS, type TierSupply } from './types';
import { useNftConfig } from './use-nft-config';

const logger = useLogger('rotki-sponsorship-contract');

// Lazy load ethers Contract
async function createContract(address: string, abi: any[], providerOrSigner: Provider | Signer): Promise<Contract> {
  const { Contract } = await import('ethers/contract');
  return new Contract(address, abi, providerOrSigner);
}

// Lazy load RPC manager
async function lazyGetRpcManager(chainId: number, rpcUrls: readonly string[]) {
  const { getRpcManager } = await import('./rpc-checker');
  return getRpcManager(chainId, rpcUrls);
}

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
  async createContract(address: string, abi: any[], providerOrSigner: Provider | Signer): Promise<Contract> {
    return createContract(address, abi, providerOrSigner);
  },

  /**
   * Create a Rotki Sponsorship contract instance
   * @param providerOrSigner Provider or Signer instance
   * @param contractAddress Contract address to use
   * @returns Contract instance
   */
  async createRotkiSponsorshipContract(providerOrSigner: Provider | Signer, contractAddress: string): Promise<Contract> {
    return createContract(contractAddress, ROTKI_SPONSORSHIP_ABI, providerOrSigner);
  },

  /**
   * Execute a contract operation with provider fallback
   * @param userProvider Optional provider from user wallet
   * @param contractCall Function that receives contract instance and returns result
   * @returns Promise with the contract call result
   */
  async executeWithContract<T>(
    contractCall: (contract: Contract) => Promise<T>,
    userProvider?: Provider,
  ): Promise<T> {
    const { CHAIN_ID, CONTRACT_ADDRESS } = useNftConfig();

    if (userProvider) {
      // Use provided provider (from user wallet)
      const contract = await this.createRotkiSponsorshipContract(userProvider, get(CONTRACT_ADDRESS));
      return contractCall(contract);
    }
    else {
      // Use RPC manager with automatic fallback
      const chainId = get(CHAIN_ID);
      const chainConfig = Object.values(CHAIN_CONFIGS).find(config => config.chainId === chainId);
      if (!chainConfig) {
        throw new Error(`Unsupported chain ID: ${chainId}`);
      }

      const rpcManager = await lazyGetRpcManager(chainId, chainConfig.rpcUrls);

      return rpcManager.executeWithFallback(async (ethersProvider) => {
        const contract = await this.createRotkiSponsorshipContract(ethersProvider, get(CONTRACT_ADDRESS));
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
  async getContractWithProvider(provider: Provider, contractAddress: string): Promise<Contract> {
    return this.createRotkiSponsorshipContract(provider, contractAddress);
  },

  /**
   * Get contract instance with user provider or signer (for wallet operations)
   * @param providerOrSigner Provider or Signer from user wallet
   * @returns Contract instance connected to user provider/signer
   */
  async getContractWithUserProvider(providerOrSigner: Provider | Signer): Promise<Contract> {
    const { CONTRACT_ADDRESS } = useNftConfig();
    return createContract(get(CONTRACT_ADDRESS), ROTKI_SPONSORSHIP_ABI, providerOrSigner);
  },
};

export async function refreshSupplyData(provider?: Provider): Promise<Record<string, TierSupply>> {
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
