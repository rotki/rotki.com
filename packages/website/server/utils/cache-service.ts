import { createStorage, type Storage } from 'unstorage';
import memoryDriver from 'unstorage/drivers/memory';
import redisDriver from 'unstorage/drivers/redis';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('cache-service');

export class CacheService {
  private readonly storage: Storage;

  constructor() {
    const { redis } = useRuntimeConfig();

    let driver;
    if (redis.host && redis.password !== undefined) {
      logger.info('Using Redis cache driver');
      driver = redisDriver({
        base: 'cache:',
        host: redis.host,
        password: redis.password,
      });
    }
    else {
      logger.info('Using memory cache driver');
      driver = memoryDriver();
    }

    this.storage = createStorage({ driver });
  }

  async getItem<T>(key: string): Promise<T | null> {
    return this.storage.getItem<T>(key);
  }

  async setItem(key: string, value: any, options?: any): Promise<void> {
    await this.storage.setItem(key, value, options);
  }

  async removeItem(key: string): Promise<void> {
    await this.storage.removeItem(key);
  }
}

// Create singleton instance
let cacheService: CacheService | null = null;

export function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService();
  }
  return cacheService;
}
