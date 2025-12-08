import { createTimeoutPromise } from '#shared/utils/timeout';

/**
 * Smart retry logic with exponential backoff
 */

interface RetryOptions {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  factor: number;
}

const DEFAULT_OPTIONS: RetryOptions = {
  factor: 2,
  initialDelay: 1000,
  maxDelay: 10000,
  maxRetries: 3,
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry options
 * @returns Promise that resolves to the function result
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;

  for (let i = 0; i < opts.maxRetries; i++) {
    try {
      return await fn();
    }
    catch (error) {
      lastError = error;

      // Don't retry permanent errors
      if (isPermanentError(error)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * opts.factor ** i,
        opts.maxDelay,
      );

      if (i < opts.maxRetries - 1) {
        await createTimeoutPromise(delay, resolve => resolve());
      }
    }
  }

  throw lastError;
}

/**
 * Check if an error is permanent and should not be retried
 */
function isPermanentError(error: any): boolean {
  // 4xx errors (except 429) are permanent
  if (error.statusCode >= 400 && error.statusCode < 500 && error.statusCode !== 429) {
    return true;
  }

  // Check for fetch response status
  if (error.status >= 400 && error.status < 500 && error.status !== 429) {
    return true;
  }

  // Invalid IPFS hash
  if (error.message?.includes('invalid CID')) {
    return true;
  }

  // Invalid contract address
  return !!error.message?.includes('invalid address');
}
