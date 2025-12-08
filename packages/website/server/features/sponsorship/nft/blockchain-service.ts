import type { NftConfig } from '#shared/features/sponsorship/types';
import { CHAIN_CONFIGS } from '#shared/features/sponsorship/constants';
import { ContractFactory } from '#shared/features/sponsorship/contract';
import { getRpcManager, type RpcManager } from '#shared/features/sponsorship/rpc-checker';
import { useLogger } from '#shared/utils/use-logger';
import { Multicall } from '~~/server/utils/multicall';

/**
 * BlockchainService - Handles all blockchain interactions
 * Provides methods for contract calls, multicall operations, and RPC management
 * Encapsulates all blockchain complexity away from business logic
 */
class BlockchainService {
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
      const multicall = Multicall.create(provider);

      const releaseIdResults = await multicall.callSameContract(contract, [
        { args: [], method: 'currentReleaseId' },
      ]);

      const firstResult = releaseIdResults[0];
      // Check if multicall failed and fallback to direct call
      if (!firstResult?.success || firstResult.value === undefined) {
        this.logger.warn('Multicall failed for currentReleaseId, falling back to direct call');

        try {
          const currentReleaseId = contract.currentReleaseId;
          if (!currentReleaseId)
            throw new Error('Contract does not support currentReleaseId');
          const releaseId = Number(await currentReleaseId());
          this.logger.debug(`Retrieved release ID (via fallback): ${releaseId}`);
          return releaseId;
        }
        catch (error) {
          throw new Error(`Failed to fetch current release ID: ${String(error)}`);
        }
      }

      const releaseId = Number(firstResult.value);
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
      const multicall = Multicall.create(provider);

      // Check if token exists and get basic data
      const firstBatchResults = await multicall.callSameContract(contract, [
        { args: [tokenId], method: 'ownerOf' },
        { args: [tokenId], method: 'tokenReleaseId' },
        { args: [tokenId], method: 'tokenTierId' },
        { args: [tokenId], method: 'tokenURI' },
      ]);

      // Check if multicall returned empty results and fallback to individual calls
      const isEmptyResult = firstBatchResults.every(result => !result.success || !result.value);
      if (isEmptyResult) {
        this.logger.warn('Multicall returned empty results, falling back to individual calls');

        try {
          // Fallback to individual contract calls
          const ownerOf = contract.ownerOf;
          const tokenReleaseId = contract.tokenReleaseId;
          const tokenTierId = contract.tokenTierId;
          const tokenURI = contract.tokenURI;

          if (!ownerOf || !tokenReleaseId || !tokenTierId || !tokenURI)
            throw new Error('Contract does not support required methods');

          const owner = await ownerOf(tokenId);
          const releaseId = Number(await tokenReleaseId(tokenId));
          const tierId = Number(await tokenTierId(tokenId));
          const metadataURI = await tokenURI(tokenId);

          this.logger.debug(`Token ${tokenId} basic data (via fallback):`, {
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
        }
        catch (error) {
          this.logger.warn(`Token ${tokenId} does not exist or error occurred:`, error);
          return null;
        }
      }

      const ownerResult = firstBatchResults[0];
      const releaseResult = firstBatchResults[1];
      const tierResult = firstBatchResults[2];
      const metadataResult = firstBatchResults[3];

      // Check if token exists
      if (!ownerResult?.success) {
        this.logger.warn(`Token ${tokenId} does not exist`);
        return null;
      }

      const owner = ownerResult.value;
      const releaseId = Number(releaseResult?.value);
      const tierId = Number(tierResult?.value);
      const metadataURI = metadataResult?.value;

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
      const multicall = Multicall.create(provider);

      this.logger.debug(`Fetching tier info for tier ${tierId}, release ${releaseId} via from ${config.CONTRACT_ADDRESS}`);

      const tierResults = await multicall.callSameContract(contract, [
        { args: [releaseId, tierId], method: 'getTierInfo' },
      ]);

      const tierResult = tierResults[0];
      // Check if multicall returned empty result and fallback to individual call
      if (!tierResult?.success || !tierResult.value) {
        this.logger.warn(`Multicall failed for tier ${tierId}, release ${releaseId}, falling back to individual call`);

        try {
          // Fallback to individual contract call
          const getTierInfo = contract.getTierInfo;
          if (!getTierInfo)
            throw new Error('Contract does not support getTierInfo');
          const tierInfo = await getTierInfo(releaseId, tierId);
          const [maxSupply, currentSupply, metadataURI] = tierInfo;

          return {
            currentSupply: Number(currentSupply),
            maxSupply: Number(maxSupply),
            metadataURI,
          };
        }
        catch (error) {
          this.logger.warn(`Failed to fetch tier info for tier ${tierId}, release ${releaseId}:`, error);
          return null;
        }
      }

      const [maxSupply, currentSupply, metadataURI] = tierResult.value;

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
      const multicall = Multicall.create(provider);

      // Batch all getTierInfo calls
      const tierInfoCalls = tierIds.map(tierId => ({
        args: [releaseId, tierId],
        method: 'getTierInfo',
      }));

      const tierResults = await multicall.callSameContract(contract, tierInfoCalls);

      // Check if all multicall results are empty
      const allEmpty = tierResults.every(result => !result.success || !result.value);

      if (allEmpty) {
        this.logger.warn('All multicall results are empty, falling back to individual calls');

        const getTierInfo = contract.getTierInfo;
        if (!getTierInfo)
          throw new Error('Contract does not support getTierInfo');

        // Fallback to individual calls for all tiers
        const results: Record<number, {
          maxSupply: number;
          currentSupply: number;
          metadataURI: string;
        } | null> = {};

        for (const tierId of tierIds) {
          try {
            const tierInfo = await getTierInfo(releaseId, tierId);
            const [maxSupply, currentSupply, metadataURI] = tierInfo;

            this.logger.debug(`Tier ${tierId} (via fallback): currentSupply=${Number(currentSupply)}, maxSupply=${Number(maxSupply)}`);

            results[tierId] = {
              currentSupply: Number(currentSupply),
              maxSupply: Number(maxSupply),
              metadataURI,
            };
          }
          catch (error) {
            this.logger.warn(`Failed to fetch tier info for tier ${tierId}:`, error);
            results[tierId] = null;
          }
        }

        return results;
      }

      // Process multicall results (some might have failed individually)
      const results: Record<number, {
        maxSupply: number;
        currentSupply: number;
        metadataURI: string;
      } | null> = {};

      const getTierInfo = contract.getTierInfo;

      for (const [index, result] of tierResults.entries()) {
        const tierId = tierIds[index];

        if (tierId === undefined)
          continue;

        if (!result.success || !result.value) {
          // Try individual call for this specific tier
          try {
            this.logger.debug(`Tier ${tierId} failed in multicall, trying individual call`);
            if (!getTierInfo)
              throw new Error('Contract does not support getTierInfo');
            const tierInfo = await getTierInfo(releaseId, tierId);
            const [maxSupply, currentSupply, metadataURI] = tierInfo;

            results[tierId] = {
              currentSupply: Number(currentSupply),
              maxSupply: Number(maxSupply),
              metadataURI,
            };
          }
          catch (error) {
            this.logger.warn(`Failed to fetch tier info for tier ${tierId} even with fallback:`, error);
            results[tierId] = null;
          }
        }
        else {
          const [maxSupply, currentSupply, metadataURI] = result.value;

          this.logger.debug(`Tier ${tierId}: currentSupply=${Number(currentSupply)}, maxSupply=${Number(maxSupply)}`);

          results[tierId] = {
            currentSupply: Number(currentSupply),
            maxSupply: Number(maxSupply),
            metadataURI,
          };
        }
      }

      return results;
    });
  }
}

// Create and export singleton instance
export const blockchainService = new BlockchainService();
