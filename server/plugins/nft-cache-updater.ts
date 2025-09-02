import { useLogger } from '~/utils/use-logger';
import { performCompleteCacheUpdate } from '../utils/cache-updater';

export default defineNitroPlugin(() => {
  const logger = useLogger('nft-cache-updater-nitro');

  // Skip during build process
  // eslint-disable-next-line node/prefer-global/process
  if (process.env.NODE_ENV === 'prerender' || process.env.NITRO_PRESET === 'nitro-prerender') {
    logger.debug('Skipping cache updating during build/prerender');
    return;
  }

  // Only run cache updating on the first PM2 instance (or when not using PM2)
  // eslint-disable-next-line node/prefer-global/process
  const instanceId = process.env.pm_id || process.env.NODE_APP_INSTANCE || '0';
  if (instanceId !== '0') {
    logger.debug(`Skipping cache updating on PM2 instance ${instanceId}`);
    return;
  }

  // Check if sponsorship feature is enabled
  const { public: { sponsorshipEnabled } } = useRuntimeConfig();
  if (!sponsorshipEnabled) {
    logger.info('Sponsorship feature is disabled, skipping cache updating');
    return;
  }

  logger.info('Starting cache updating on Nitro startup...');

  // Delay cache updating to ensure all services are initialized
  const updateCache = async (): Promise<void> => {
    try {
      logger.debug('Beginning delayed cache updating...');
      const result = await performCompleteCacheUpdate();

      if (result.tierCaching.success) {
        const cachedTiers = Object.keys(result.tierCaching.supplies).length;
        logger.success(`Successfully updated cache for ${cachedTiers} tiers and ${result.imageCaching.success} images`);

        if (result.imageCaching.failed > 0) {
          logger.warn(`${result.imageCaching.failed} images failed to cache`);
        }
      }
      else {
        logger.error('Cache updating failed');
        if (result.tierCaching.errors.length > 0) {
          result.tierCaching.errors.forEach(error => logger.error(`${error}`));
        }
      }
    }
    catch (error) {
      logger.error('Error during cache updating:', error);
    }
  };

  setTimeout(() => {
    updateCache().catch(error => logger.error('Unhandled error in cache updating:', error));
  }, 5000);
});
