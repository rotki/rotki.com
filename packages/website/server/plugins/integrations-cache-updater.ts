import { useLogger } from '#shared/utils/use-logger';

export default defineNitroPlugin(() => {
  // Skip cache warming during pre-rendering
  if (import.meta.prerender) {
    return;
  }

  const logger = useLogger('integrations-cache-updater');

  logger.info('Warming integrations cache on startup...');

  const warmCache = async (): Promise<void> => {
    try {
      // Trigger the API endpoint to populate cache
      await $fetch('/api/integrations');
      logger.info('Integrations cache warmed successfully');
    }
    catch (error) {
      logger.error('Failed to warm integrations cache:', error);
    }
  };

  // Delay to ensure server is ready
  setTimeout(() => {
    warmCache().catch(error => logger.error('Unhandled error warming cache:', error));
  }, 5000);
});
