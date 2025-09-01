import { useLogger } from '~/utils/use-logger';

const logger = useLogger('server-rpc-checker');

/**
 * Tests if an RPC URL is working by attempting to get the block number
 */
async function testRpcUrl(url: string, timeout = 5000): Promise<boolean> {
  try {
    const provider = createProvider(url);

    await Promise.race([
      provider.getBlockNumber(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout),
      ),
    ]);

    return true;
  }
  catch (error: any) {
    logger.debug(`RPC ${url} failed: ${error?.message}`);
    return false;
  }
}

/**
 * Finds the first working RPC URL from a list
 */
export async function findWorkingRpcUrl(urls: readonly string[]): Promise<string> {
  for (const url of urls) {
    logger.debug(`Testing RPC: ${url}`);
    const isWorking = await testRpcUrl(url);

    if (isWorking) {
      logger.info(`Using RPC: ${url}`);
      return url;
    }
  }

  // If none work, return the first one as fallback
  logger.warn('No working RPC found, using first URL as fallback');
  return urls[0];
}

// Cache for working RPC URLs to avoid repeated checks
const rpcCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Gets a working RPC URL with caching
 */
export async function getWorkingRpcUrl(urls: readonly string[]): Promise<string> {
  const cacheKey = urls.join(',');
  const cached = rpcCache.get(cacheKey);

  // Return cached URL if still fresh
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.url;
  }

  // Find a working URL
  const workingUrl = await findWorkingRpcUrl(urls);

  // Cache the result
  rpcCache.set(cacheKey, { timestamp: Date.now(), url: workingUrl });

  return workingUrl;
}
