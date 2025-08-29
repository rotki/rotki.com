import { useLogger } from '~/utils/use-logger';
import { performCompleteCacheWarming } from '../utils/cache-warmer';

export default defineNitroPlugin(() => {
  const logger = useLogger('nft-cache-warmer-nitro');

  // Skip during build process
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV === 'prerender' || process.env.NITRO_PRESET === 'nitro-prerender') {
    logger.info('Skipping cache warming during build/prerender');
    return;
  }

  // Only run cache warming on the first PM2 instance (or when not using PM2)
  // eslint-disable-next-line node/prefer-global/process
  const instanceId = process.env.pm_id || process.env.NODE_APP_INSTANCE || '0';
  if (instanceId !== '0') {
    logger.info(`Skipping cache warming on PM2 instance ${instanceId}`);
    return;
  }

  // Check if sponsorship feature is enabled
  const { public: { sponsorshipEnabled } } = useRuntimeConfig();
  if (!sponsorshipEnabled) {
    logger.info('Sponsorship feature is disabled, skipping cache warming');
    return;
  }

  logger.info('Starting cache warming on Nitro startup...');

  // Delay cache warming to ensure all services are initialized
  const warmCache = async (): Promise<void> => {
    try {
      logger.info('Beginning delayed cache warming...');
      const result = await performCompleteCacheWarming();

      if (result.tierCaching.success) {
        const cachedTiers = Object.keys(result.tierCaching.supplies).length;
        logger.success(`Successfully warmed cache for ${cachedTiers} tiers and ${result.imageCaching.success} images`);

        if (result.imageCaching.failed > 0) {
          logger.warn(`${result.imageCaching.failed} images failed to cache`);
        }
      }
      else {
        logger.error('Cache warming failed');
        if (result.tierCaching.errors.length > 0) {
          result.tierCaching.errors.forEach(error => logger.error(`${error}`));
        }
      }
    }
    catch (error) {
      logger.error('Error during cache warming:', error);
    }
  };

  setTimeout(() => {
    warmCache().catch(error => logger.error('Unhandled error in cache warming:', error));
  }, 5000);
});
