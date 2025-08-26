import { getCacheService } from './cache-service';

interface CacheOptions<ArgsT extends unknown[] = any[]> {
  getKey: (...args: ArgsT) => string;
  maxAge: number; // in seconds
  name?: string;
}

export function createCachedFunction<T, ArgsT extends unknown[] = any[]>(
  fn: (...args: ArgsT) => T | Promise<T>,
  opts: CacheOptions<ArgsT>,
): (...args: ArgsT) => Promise<T> {
  const cache = getCacheService();

  return async (...args: ArgsT): Promise<T> => {
    const key = opts.getKey(...args);

    // Try to get from cache
    const cached = await cache.getItem<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    await cache.setItem(key, result, { ttl: opts.maxAge });

    return result;
  };
}

export async function clearCachedFunction<ArgsT extends unknown[] = any[]>(
  opts: CacheOptions<ArgsT>,
  ...args: ArgsT
): Promise<void> {
  const cache = getCacheService();
  const key = opts.getKey(...args);
  await cache.removeItem(key);
}
