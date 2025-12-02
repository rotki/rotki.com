import { useLogger } from '#shared/utils/use-logger';
import { cacheUpdaterService } from '../features/sponsorship/cache/cache-updater';

export default defineNitroPlugin(() => {
  const logger = useLogger('nft-cache-updater-nitro');

  logger.info('Starting cache updating on Nitro startup...');

  // Delay cache updating to ensure all services are initialized
  const updateCache = async (): Promise<void> => {
    try {
      logger.debug('Beginning delayed cache updating...');
      await cacheUpdaterService.performUpdate();
    }
    catch (error) {
      logger.error('Error during cache updating:', error);
    }
  };

  setTimeout(() => {
    updateCache().catch(error => logger.error('Unhandled error in cache updating:', error));
  }, 5000);
});
