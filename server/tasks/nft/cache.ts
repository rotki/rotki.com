import { useLogger } from '~/utils/use-logger';
import { performCompleteCacheUpdate } from '../../utils/cache-updater';

const logger = useLogger('nft-cache-updater-task');

export default defineTask({
  meta: {
    description: 'Update NFT tier and image cache periodically',
    name: 'nft:cache',
  },
  async run() {
    // Only run cache updating on the first PM2 instance (or when not using PM2)
    // eslint-disable-next-line node/prefer-global/process
    const instanceId = process.env.pm_id || process.env.NODE_APP_INSTANCE || '0';
    if (instanceId !== '0') {
      logger.debug(`Skipping cache updating task on PM2 instance ${instanceId}`);
      return { reason: 'not primary PM2 instance', result: 'skipped' };
    }

    // Check if sponsorship feature is enabled
    const { public: { sponsorshipEnabled } } = useRuntimeConfig();
    if (!sponsorshipEnabled) {
      logger.debug('Sponsorship feature is disabled, skipping cache updating');
      return { reason: 'sponsorship disabled', result: 'skipped' };
    }

    try {
      logger.info('Running scheduled cache updating task...');
      const result = await performCompleteCacheUpdate();

      if (result.tierCaching.success) {
        const cachedTiers = Object.keys(result.tierCaching.supplies).length;
        logger.success(`Successfully updated cache for ${cachedTiers} tiers and ${result.imageCaching.success} images`);

        if (result.imageCaching.failed > 0) {
          logger.warn(`${result.imageCaching.failed} images failed to cache`);
        }

        return {
          cachedImages: result.imageCaching.success,
          cachedTiers,
          failedImages: result.imageCaching.failed,
          result: 'success',
        };
      }
      else {
        logger.error('Cache updating failed');
        if (result.tierCaching.errors.length > 0) {
          result.tierCaching.errors.forEach(error => logger.error(`${error}`));
        }

        return {
          errors: result.tierCaching.errors,
          result: 'failed',
        };
      }
    }
    catch (error) {
      logger.error('Error during cache updating:', error);
      return {
        error: error instanceof Error ? error.message : String(error),
        result: 'error',
      };
    }
  },
});
