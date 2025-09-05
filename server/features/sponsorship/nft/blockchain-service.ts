import type { NftConfig } from '~/composables/rotki-sponsorship/types';
import { CHAIN_CONFIGS } from '~/composables/rotki-sponsorship/constants';
import { ContractFactory } from '~/composables/rotki-sponsorship/contract';
import { getRpcManager, type RpcManager } from '~/composables/rotki-sponsorship/rpc-checker';
import { Multicall } from '~/server/utils/multicall';
import { useLogger } from '~/utils/use-logger';

/**
 * BlockchainService - Handles all blockchain interactions
 * Provides methods for contract calls, multicall operations, and RPC management
 * Encapsulates all blockchain complexity away from business logic
 */
export class BlockchainService {
  private logger = useLogger('blockchain-service');

  /**
   * Get RPC manager for a given config
   */
  private getRpcManagerForConfig(config: NftConfig): RpcManager {
    const chainConfig = Object.values(CHAIN_CONFIGS).find(c => c.chainId === config.CHAIN_ID);
    if (!chainConfig) {
      throw new Error(`Unsupported chain ID: ${config.CHAIN_ID}`);
    }
    return getRpcManager(config.CHAIN_ID, chainConfig.rpcUrls);
  }

  /**
   * Get current release ID from contract
   */
  async getCurrentReleaseId(config: NftConfig): Promise<number> {
    const rpcManager = this.getRpcManagerForConfig(config);

    return rpcManager.executeWithFallback(async (provider) => {
      const contract = ContractFactory.getContractWithProvider(provider, config.CONTRACT_ADDRESS);
      const multicall = new Multicall(provider);

      const releaseIdResults = await multicall.callSameContract(contract, [
        { args: [], method: 'currentReleaseId' },
      ]);

      if (!releaseIdResults[0].success) {
        throw new Error('Failed to fetch current release ID');
      }

      const releaseId = Number(releaseIdResults[0].value);
      this.logger.debug(`Retrieved release ID: ${releaseId}`);
      return releaseId;
    });
  }

  /**
   * Fetch basic token data (owner, releaseId, tierId, tokenURI)
   */
  async fetchTokenBasicData(config: NftConfig, tokenId: number): Promise<{
    owner: string;
    releaseId: number;
    tierId: number;
    metadataURI: string;
  } | null> {
    const rpcManager = this.getRpcManagerForConfig(config);

    return rpcManager.executeWithFallback(async (provider) => {
      const contract = ContractFactory.getContractWithProvider(provider, config.CONTRACT_ADDRESS);
      const multicall = new Multicall(provider);

      // Check if token exists and get basic data
      const firstBatchResults = await multicall.callSameContract(contract, [
        { args: [tokenId], method: 'ownerOf' },
        { args: [tokenId], method: 'tokenReleaseId' },
        { args: [tokenId], method: 'tokenTierId' },
        { args: [tokenId], method: 'tokenURI' },
      ]);

      // Check if token exists
      if (!firstBatchResults[0].success) {
        this.logger.warn(`Token ${tokenId} does not exist`);
        return null;
      }

      const owner = firstBatchResults[0].value;
      const releaseId = Number(firstBatchResults[1].value);
      const tierId = Number(firstBatchResults[2].value);
      const metadataURI = firstBatchResults[3].value;

      this.logger.debug(`Token ${tokenId} basic data:`, {
        metadataURI,
        owner,
        releaseId,
        tierId,
      });

      return {
        metadataURI,
        owner,
        releaseId,
        tierId,
      };
    });
  }

  /**
   * Fetch tier info for a specific tier
   */
  async fetchTierInfo(config: NftConfig, releaseId: number, tierId: number): Promise<{
    maxSupply: number;
    currentSupply: number;
    metadataURI: string;
  } | null> {
    const rpcManager = this.getRpcManagerForConfig(config);

    return rpcManager.executeWithFallback(async (provider) => {
      const contract = ContractFactory.getContractWithProvider(provider, config.CONTRACT_ADDRESS);
      const multicall = new Multicall(provider);

      const tierResults = await multicall.callSameContract(contract, [
        { args: [releaseId, tierId], method: 'getTierInfo' },
      ]);

      if (!tierResults[0].success || !tierResults[0].value) {
        this.logger.warn(`Failed to fetch tier info for tier ${tierId}, release ${releaseId}`);
        return null;
      }

      const [maxSupply, currentSupply, metadataURI] = tierResults[0].value;

      return {
        currentSupply: Number(currentSupply),
        maxSupply: Number(maxSupply),
        metadataURI,
      };
    });
  }

  /**
   * Batch fetch tier info for multiple tiers
   */
  async fetchMultipleTierInfo(
    config: NftConfig,
    releaseId: number,
    tierIds: number[],
  ): Promise<Record<number, {
    maxSupply: number;
    currentSupply: number;
    metadataURI: string;
  } | null>> {
    const rpcManager = this.getRpcManagerForConfig(config);

    return rpcManager.executeWithFallback(async (provider) => {
      const contract = ContractFactory.getContractWithProvider(provider, config.CONTRACT_ADDRESS);
      const multicall = new Multicall(provider);

      // Batch all getTierInfo calls
      const tierInfoCalls = tierIds.map(tierId => ({
        args: [releaseId, tierId],
        method: 'getTierInfo',
      }));

      const tierResults = await multicall.callSameContract(contract, tierInfoCalls);

      // Process results
      const results: Record<number, {
        maxSupply: number;
        currentSupply: number;
        metadataURI: string;
      } | null> = {};

      tierResults.forEach((result, index) => {
        const tierId = tierIds[index];

        if (!result.success || !result.value) {
          results[tierId] = null;
          return;
        }

        const [maxSupply, currentSupply, metadataURI] = result.value;

        this.logger.debug(`Tier ${tierId}: currentSupply=${Number(currentSupply)}, maxSupply=${Number(maxSupply)}`);

        results[tierId] = {
          currentSupply: Number(currentSupply),
          maxSupply: Number(maxSupply),
          metadataURI,
        };
      });

      return results;
    });
  }
}

// Create and export singleton instance
export const blockchainService = new BlockchainService();
