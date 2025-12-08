import type { NftConfig, TierInfoResult, TierMetadata, TokenMetadata } from '~/composables/rotki-sponsorship/types';
import { findTierById, normalizeIpfsUrl } from '~/composables/rotki-sponsorship/utils';
import { nftCacheManager } from '~/server/features/sponsorship/cache/managers/nft-cache-manager';
import { blockchainService } from '~/server/features/sponsorship/nft/blockchain-service';
import { getServerNftConfig } from '~/server/features/sponsorship/nft/config';
import { metadataProcessor } from '~/server/features/sponsorship/nft/metadata-processor';
import { deduplicatedFetch } from '~/server/utils/request-dedup';
import { retryWithBackoff } from '~/server/utils/retry';
import { useLogger } from '~/utils/use-logger';

/**
 * NFT Core Service - Handles all NFT-related blockchain interactions
 * Provides efficient methods for fetching token data, tier information, and metadata
 * Uses multicall for batch operations and includes comprehensive caching
 */
class NftCoreService {
  private logger = useLogger('nft-core');
  private cachedConfig: NftConfig | undefined;

  /**
   * Create a TierInfoResult from blockchain tier info with optional processed metadata
   * If no metadata provided, uses empty defaults
   */
  private createTierInfoResult(
    blockchainTierInfo: {
      maxSupply: number;
      currentSupply: number;
      metadataURI: string;
    },
    processedMetadata?: {
      benefits: string;
      imageUrl: string;
      releaseName: string;
    },
  ): TierInfoResult {
    return {
      benefits: processedMetadata?.benefits || '',
      currentSupply: blockchainTierInfo.currentSupply,
      imageUrl: processedMetadata?.imageUrl || '',
      maxSupply: blockchainTierInfo.maxSupply,
      metadataURI: blockchainTierInfo.metadataURI,
      releaseName: processedMetadata?.releaseName || '',
    };
  }

  /**
   * Get server NFT config with caching
   */
  async getConfig(): Promise<NftConfig> {
    if (!this.cachedConfig) {
      this.cachedConfig = await getServerNftConfig();
    }
    return this.cachedConfig;
  }

  /**
   * Update the cached release ID
   * This allows sharing the fetched release ID across requests
   */
  updateCachedReleaseId(releaseId: number): void {
    if (this.cachedConfig) {
      this.cachedConfig.RELEASE_ID = releaseId;
      this.logger.info(`Updated cached release ID to: ${releaseId}`);
    }
  }

  /**
   * Fetch metadata with caching and deduplication
   */
  async fetchMetadata(metadataURI: string): Promise<TierMetadata> {
    const cached = await nftCacheManager.getMetadata(metadataURI);
    if (cached) {
      this.logger.debug(`Cache hit for metadata: ${metadataURI}`);
      return cached;
    }

    return deduplicatedFetch(`metadata:${metadataURI}`, async () => {
      const metadataUrl = normalizeIpfsUrl(metadataURI);

      const response = await retryWithBackoff(async () => {
        const res = await fetch(metadataUrl);
        if (!res.ok) {
          const error = new Error(`Metadata fetch error: ${res.status}`);
          (error as any).status = res.status;
          throw error;
        }
        return res;
      }, {
        initialDelay: 500,
        maxRetries: 3,
      });

      const metadata = await response.json();
      await nftCacheManager.setMetadata(metadataURI, metadata);
      return metadata;
    });
  }

  /**
   * Fetch token data using blockchain service
   */
  async fetchTokenData(tokenId: number): Promise<TokenMetadata | null> {
    try {
      const config = await this.getConfig();

      const basicData = await blockchainService.fetchTokenBasicData(config, tokenId);
      if (!basicData) {
        return null;
      }

      const { metadataURI, owner, releaseId, tierId } = basicData;
      let tierInfo = await nftCacheManager.getSingleTierInfo(tierId, config, releaseId);

      if (!tierInfo) {
        const blockchainTierInfo = await blockchainService.fetchTierInfo(config, releaseId, tierId);
        if (blockchainTierInfo) {
          tierInfo = this.createTierInfoResult(blockchainTierInfo);
        }
      }

      const metadata = await this.fetchMetadata(metadataURI);
      const imageUrl = metadataProcessor.processImageUrl(metadata);

      let releaseName = '';
      if (tierInfo?.metadataURI) {
        try {
          const tierMetadata = await this.fetchMetadata(tierInfo.metadataURI);
          const { benefits, imageUrl: tierImageUrl, releaseName: extractedReleaseName } = metadataProcessor.processTierMetadata(tierMetadata);

          releaseName = extractedReleaseName;

          if (tierInfo.benefits === '' && tierInfo.imageUrl === '' && tierInfo.releaseName === '') {
            tierInfo.benefits = benefits;
            tierInfo.imageUrl = tierImageUrl;
            tierInfo.releaseName = releaseName;
            await nftCacheManager.setSingleTierInfo(tierId, tierInfo, config, releaseId);
            this.logger.debug(`Cached complete tier info for tier ${tierId}`);
          }

          this.logger.debug(`Tier ${tierId} release name: ${releaseName}`);
        }
        catch (error) {
          this.logger.error(`Error fetching tier metadata for release name:`, error);
        }
      }

      return {
        imageUrl,
        metadata,
        metadataURI,
        owner,
        releaseId,
        releaseName,
        tierId,
        tierName: findTierById(tierId)?.key || 'bronze',
        tokenId,
      };
    }
    catch (error) {
      this.logger.error(`Error fetching token ${tokenId}:`, error);
      throw error;
    }
  }

  /**
   * Cached version of token data fetching
   */
  async fetchCachedTokenData(tokenId: number): Promise<TokenMetadata> {
    const config = await this.getConfig();

    const cached = await nftCacheManager.getTokenData(tokenId, config);
    if (cached) {
      this.logger.debug(`Cache hit for token: ${tokenId}`);
      return cached;
    }

    const tokenData = await this.fetchTokenData(tokenId);
    if (tokenData) {
      await nftCacheManager.setTokenData(tokenId, tokenData, config);
    }
    else {
      throw createError({
        statusCode: 404,
        statusMessage: 'Token not found',
      });
    }

    return tokenData;
  }

  /**
   * Fetch tiers with intelligent caching strategy
   * @param tierIds Array of tier IDs to fetch
   * @returns Object containing release ID and tier data
   */
  async fetchTiers(
    tierIds: number[],
  ): Promise<{
    releaseId: number | undefined;
    tiers: Record<number, TierInfoResult>;
  }> {
    if (!tierIds || tierIds.length === 0) {
      return {
        releaseId: undefined,
        tiers: {},
      };
    }

    const config = await this.getConfig();
    let releaseId = config.RELEASE_ID;
    let allTiers: Record<number, TierInfoResult> = {};

    if (releaseId) {
      const { cached, missing } = await nftCacheManager.getCachedTierInfo(tierIds, config, releaseId);

      if (missing.length === 0) {
        this.logger.debug(`All ${tierIds.length} tiers found in cache`);
        return {
          releaseId,
          tiers: cached,
        };
      }

      allTiers = cached;
      this.logger.debug(`Found ${Object.keys(cached).length} tiers in cache, need to fetch ${missing.length}`);

      if (missing.length > 0) {
        const { tiers: fetchedTiers } = await this.fetchAllTiersWithRelease(missing);
        for (const [tierId, tierData] of Object.entries(fetchedTiers)) {
          if (tierData) {
            allTiers[Number(tierId)] = tierData;
          }
        }
      }
    }
    else {
      this.logger.debug('No release ID available, fetching from blockchain');
      const result = await this.fetchAllTiersWithRelease(tierIds);
      releaseId = result.releaseId;
      this.updateCachedReleaseId(releaseId);
      allTiers = {};
      for (const [tierId, tierData] of Object.entries(result.tiers)) {
        if (tierData) {
          allTiers[Number(tierId)] = tierData;
        }
      }
    }

    return {
      releaseId,
      tiers: allTiers,
    };
  }

  /**
   * Get release ID from config or fallback to blockchain
   * @param config NFT configuration
   * @returns Current release ID
   */
  private async getReleaseId(config: NftConfig): Promise<number> {
    if (config.RELEASE_ID !== undefined && config.RELEASE_ID !== null) {
      this.logger.info(`Using config release ID: ${config.RELEASE_ID}`);
      return config.RELEASE_ID;
    }
    else {
      const releaseId = await blockchainService.getCurrentReleaseId(config);
      this.logger.info(`Retrieved release ID from blockchain: ${releaseId}`);
      return releaseId;
    }
  }

  /**
   * Fetch and cache missing tier data from blockchain
   * @param missingTierIds Array of tier IDs that are not in cache
   * @param config NFT configuration
   * @param releaseId Current release ID
   * @returns Record of tier IDs to TierInfoResult or undefined
   */
  private async fetchAndCacheMissingTiers(
    missingTierIds: number[],
    config: NftConfig,
    releaseId: number,
  ): Promise<Record<number, TierInfoResult | undefined>> {
    const tierInfoResults = await blockchainService.fetchMultipleTierInfo(config, releaseId, missingTierIds);
    const newTierResults: Record<number, TierInfoResult | undefined> = {};
    const tiers: Record<number, TierInfoResult | undefined> = {};

    await Promise.all(
      missingTierIds.map(async (tierId) => {
        const tierInfo = tierInfoResults[tierId];

        if (!tierInfo || !tierInfo.metadataURI) {
          newTierResults[tierId] = undefined;
          tiers[tierId] = undefined;
          return;
        }

        try {
          const metadata = await this.fetchMetadata(tierInfo.metadataURI);
          const processedMetadata = metadataProcessor.processTierMetadata(metadata);
          const tierResult = this.createTierInfoResult(tierInfo, processedMetadata);
          newTierResults[tierId] = tierResult;
          tiers[tierId] = tierResult;
          this.logger.debug(`Successfully processed tier: ${tierId}`);
        }
        catch (error) {
          this.logger.error(`Error processing tier ${tierId}:`, error);
          newTierResults[tierId] = undefined;
          tiers[tierId] = undefined;
        }
      }),
    );

    if (Object.keys(newTierResults).length > 0) {
      await nftCacheManager.storeTierInfo(newTierResults, config, releaseId);
      this.logger.debug(`Stored ${Object.keys(newTierResults).length} new tier results in cache`);
    }

    return tiers;
  }

  /**
   * Fetch all tiers for current release - used by cache updater
   * This method fetches all specified tiers without checking cache first
   * @param tierIds Array of tier IDs to fetch
   * @returns Object containing release ID and tier data
   */
  async fetchAllTiersForRelease(
    tierIds: number[],
  ): Promise<{
    releaseId: number;
    tiers: Record<number, TierInfoResult | undefined>;
  }> {
    const config = await this.getConfig();
    const releaseId = await this.getReleaseId(config);
    const tiers = await this.fetchAndCacheMissingTiers(tierIds, config, releaseId);

    const successCount = Object.keys(tiers).filter(k => tiers[Number(k)] !== undefined).length;
    this.logger.info(`Successfully fetched ${successCount} tiers for release ${releaseId} from blockchain`);

    return {
      releaseId,
      tiers,
    };
  }

  /**
   * Unified function to fetch all tiers with release ID using blockchain service
   * This efficiently batches all blockchain operations and uses cache service for tier data
   */
  async fetchAllTiersWithRelease(
    tierIds: number[],
  ): Promise<{
    releaseId: number;
    tiers: Record<number, TierInfoResult | undefined>;
  }> {
    const config = await this.getConfig();
    const releaseId = await this.getReleaseId(config);
    const { cached, missing } = await nftCacheManager.getCachedTierInfo(tierIds, config, releaseId);
    this.logger.debug(`Cache check: ${Object.keys(cached).length} cached, ${missing.length} missing`);

    const tiers: Record<number, TierInfoResult | undefined> = {};
    for (const [tierId, tierResult] of Object.entries(cached)) {
      tiers[Number(tierId)] = tierResult;
    }

    if (missing.length > 0) {
      const fetchedTiers = await this.fetchAndCacheMissingTiers(missing, config, releaseId);
      for (const [tierId, tierData] of Object.entries(fetchedTiers)) {
        tiers[Number(tierId)] = tierData;
      }
    }

    const successCount = Object.keys(tiers).filter(k => tiers[Number(k)] !== undefined).length;
    this.logger.info(`Successfully fetched ${successCount} tiers for release ${releaseId} (${Object.keys(cached).length} from cache, ${missing.length} from blockchain)`);

    return {
      releaseId,
      tiers,
    };
  }
}

// Create and export singleton instance
export const nftCoreService = new NftCoreService();
