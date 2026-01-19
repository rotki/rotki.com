import process from 'node:process';
import { useLogger } from '#shared/utils/use-logger';
import { fetchGithubRelease } from '~~/server/api/releases/latest.get';

const logger = useLogger('releases-cache-task');

export default defineTask({
  meta: {
    description: 'Proactively refresh GitHub releases cache to keep it warm',
    name: 'releases:cache',
  },
  async run() {
    // Only run on primary instance to avoid duplicate work
    const instanceId = process.env.pm_id || process.env.NODE_APP_INSTANCE || '0';
    if (instanceId !== '0') {
      logger.debug(`Skipping releases cache update: not primary instance (${instanceId})`);
      return { reason: `not primary PM2 instance (${instanceId})`, result: 'skipped' };
    }

    try {
      logger.info('Running scheduled releases cache update...');

      // Fetch latest release from GitHub - this handles all caching internally
      const release = await fetchGithubRelease();

      logger.info(`Successfully refreshed releases cache: ${release.tag_name}`);

      return {
        result: 'success',
        version: release.tag_name,
      };
    }
    catch (error) {
      logger.error('Failed to refresh releases cache:', error);

      return {
        error: error instanceof Error ? error.message : String(error),
        result: 'error',
      };
    }
  },
});
