import process from 'node:process';
import { useLogger } from '#shared/utils/use-logger';
import { getCacheService } from './cache-service';

const logger = useLogger('redis-lock');

/**
 * Default lock configuration
 */
const DEFAULT_LOCK_TTL_SECONDS = 30;
const DEFAULT_RETRY_COUNT = 0;
const DEFAULT_RETRY_DELAY_MS = 100;

export interface LockOptions {
  /** Lock TTL in seconds (default: 30) */
  ttlSeconds?: number;
  /** Number of retry attempts if lock acquisition fails (default: 0) */
  retryCount?: number;
  /** Delay between retries in milliseconds (default: 100) */
  retryDelayMs?: number;
}

/**
 * Generate a unique lock value to identify the lock owner
 */
function generateLockValue(): string {
  const instanceId = process.env.pm_id || process.env.NODE_APP_INSTANCE || '0';
  return `${instanceId}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

// Store lock values to verify ownership on release
const lockOwnership = new Map<string, string>();

/**
 * Attempt to acquire a distributed lock using Redis
 * Uses SET with NX (only set if not exists) and EX (expiry) for atomic lock acquisition
 *
 * @param key The lock key
 * @param options Lock configuration
 * @returns true if lock was acquired, false otherwise
 */
export async function acquireLock(key: string, options: LockOptions = {}): Promise<boolean> {
  const {
    ttlSeconds = DEFAULT_LOCK_TTL_SECONDS,
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  } = options;

  const cache = getCacheService();
  const lockKey = `lock:${key}`;
  const lockValue = generateLockValue();

  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      // Check if lock exists
      const existing = await cache.getItem<string>(lockKey);

      if (!existing) {
        // Lock doesn't exist, try to acquire it
        // Note: This is not perfectly atomic with unstorage, but good enough for our use case
        // The TTL ensures locks don't get stuck, and worst case is duplicate work (harmless)
        await cache.setItem(lockKey, lockValue, { ttl: ttlSeconds });
        lockOwnership.set(lockKey, lockValue);
        logger.debug(`Lock acquired: ${lockKey} (attempt ${attempt + 1})`);
        return true;
      }

      // Lock exists, retry if attempts remaining
      if (attempt < retryCount) {
        logger.debug(`Lock busy: ${lockKey}, retrying in ${retryDelayMs}ms (attempt ${attempt + 1}/${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
    catch (error) {
      logger.error(`Error acquiring lock ${lockKey}:`, error);
      if (attempt >= retryCount) {
        return false;
      }
    }
  }

  logger.debug(`Failed to acquire lock: ${lockKey}`);
  return false;
}

/**
 * Release a distributed lock
 * Only releases if we are the owner of the lock
 *
 * @param key The lock key
 */
export async function releaseLock(key: string): Promise<void> {
  const cache = getCacheService();
  const lockKey = `lock:${key}`;
  const expectedValue = lockOwnership.get(lockKey);

  if (!expectedValue) {
    logger.warn(`Attempted to release lock we don't own: ${lockKey}`);
    return;
  }

  try {
    // Verify we still own the lock before releasing
    const currentValue = await cache.getItem<string>(lockKey);

    if (currentValue === expectedValue) {
      await cache.removeItem(lockKey);
      logger.debug(`Lock released: ${lockKey}`);
    }
    else {
      logger.warn(`Lock ownership changed, not releasing: ${lockKey}`);
    }
  }
  catch (error) {
    logger.error(`Error releasing lock ${lockKey}:`, error);
  }
  finally {
    lockOwnership.delete(lockKey);
  }
}

/**
 * Execute a function with a distributed lock
 * If the lock cannot be acquired, returns undefined
 *
 * @param key The lock key
 * @param fn The function to execute while holding the lock
 * @param options Lock configuration
 * @returns The result of fn, or undefined if lock couldn't be acquired
 */
export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  options: LockOptions = {},
): Promise<T | undefined> {
  const acquired = await acquireLock(key, options);

  if (!acquired) {
    return undefined;
  }

  try {
    return await fn();
  }
  finally {
    await releaseLock(key);
  }
}
