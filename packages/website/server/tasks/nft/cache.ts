import { useLogger } from '#shared/utils/use-logger';
import { cacheUpdaterService } from '../../features/sponsorship/cache/cache-updater';

const logger = useLogger('nft-cache-updater-task');

export default defineTask({
  meta: {
    description: 'Update NFT tier and image cache periodically',
    name: 'nft:cache',
  },
  async run() {
    try {
      logger.info('Running scheduled cache updating task...');
      const result = await cacheUpdaterService.performUpdate();

      if (result.skipped) {
        return { reason: result.reason, result: 'skipped' };
      }

      if (result.tierCaching.success) {
        const cachedTiers = Object.keys(result.tierCaching.supplies).length;
        return {
          cachedImages: result.imageCaching.success,
          cachedTiers,
          failedImages: result.imageCaching.failed,
          result: 'success',
        };
      }
      else {
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
