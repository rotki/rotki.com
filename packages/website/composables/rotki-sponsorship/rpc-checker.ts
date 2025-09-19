import { ethers } from 'ethers';
import { useLogger } from '~/utils/use-logger';

const logger = useLogger('rpc-checker');

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface CircuitBreaker {
  failureCount: number;
  lastFailTime: number;
  state: 'closed' | 'open' | 'half-open';
}

interface RpcHealthStatus {
  url: string;
  isHealthy: boolean;
  lastChecked: number;
  failureCount: number;
  circuitBreaker: CircuitBreaker;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,
  recoveryTimeout: 60 * 1000,
  rpcCallTimeout: 60 * 1000,
};

// ============================================================================
// GLOBAL STATE
// ============================================================================

// RPC health tracking
const rpcHealthMap = new Map<string, RpcHealthStatus>();

// Global RPC manager instances cached by chain
const rpcManagers = new Map<number, RpcManager>();

// ============================================================================
// CIRCUIT BREAKER FUNCTIONS
// ============================================================================

/**
 * Initialize RPC health status
 */
function initRpcHealth(url: string): RpcHealthStatus {
  return {
    circuitBreaker: {
      failureCount: 0,
      lastFailTime: 0,
      state: 'closed',
    },
    failureCount: 0,
    isHealthy: true,
    lastChecked: 0,
    url,
  };
}

/**
 * Get or create RPC health status
 */
function getRpcHealth(url: string): RpcHealthStatus {
  let health = rpcHealthMap.get(url);
  if (!health) {
    health = initRpcHealth(url);
    rpcHealthMap.set(url, health);
  }
  return health;
}

/**
 * Update circuit breaker state based on success/failure
 */
function updateCircuitBreaker(health: RpcHealthStatus, success: boolean): void {
  const now = Date.now();

  if (success) {
    // Reset on success
    health.circuitBreaker.failureCount = 0;
    health.circuitBreaker.state = 'closed';
    health.isHealthy = true;
    health.failureCount = 0;
  }
  else {
    // Increment failure count
    health.circuitBreaker.failureCount++;
    health.circuitBreaker.lastFailTime = now;
    health.failureCount++;
    health.isHealthy = false;

    // Open circuit if threshold reached
    if (health.circuitBreaker.failureCount >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
      health.circuitBreaker.state = 'open';
      logger.warn(`Circuit breaker opened for RPC: ${health.url}`);
    }
  }

  health.lastChecked = now;
}

/**
 * Check if RPC can be used based on circuit breaker state
 */
function canUseRpc(health: RpcHealthStatus): boolean {
  const now = Date.now();

  switch (health.circuitBreaker.state) {
    case 'closed':
      return true;
    case 'open':
      // Check if recovery timeout has passed
      if (now - health.circuitBreaker.lastFailTime > CIRCUIT_BREAKER_CONFIG.recoveryTimeout) {
        health.circuitBreaker.state = 'half-open';
        logger.debug(`Circuit breaker half-open for RPC: ${health.url}`);
        return true;
      }
      return false;
    case 'half-open':
      return true;
    default:
      return false;
  }
}

// ============================================================================
// RPC MANAGER CLASS
// ============================================================================

/**
 * RPC Manager class for handling fallback and circuit breaking
 */
export class RpcManager {
  private readonly rpcUrls: readonly string[];
  private readonly providerCache = new Map<string, ethers.JsonRpcProvider>();
  private currentRpcUrl: string | undefined;

  constructor(rpcUrls: readonly string[]) {
    this.rpcUrls = rpcUrls;
  }

  /**
   * Get or create a cached provider for the given RPC URL
   */
  private getProvider(rpcUrl: string): ethers.JsonRpcProvider {
    let provider = this.providerCache.get(rpcUrl);
    if (!provider) {
      provider = new ethers.JsonRpcProvider(rpcUrl);
      this.providerCache.set(rpcUrl, provider);
      logger.debug(`Created new provider for RPC: ${rpcUrl}`);
    }
    return provider;
  }

  /**
   * Clear cached provider for a specific RPC URL
   */
  private clearProvider(rpcUrl: string): void {
    const provider = this.providerCache.get(rpcUrl);
    if (provider) {
      // Destroy the provider to stop all background tasks
      provider.destroy();
      this.providerCache.delete(rpcUrl);
      logger.debug(`Cleared and destroyed provider for RPC: ${rpcUrl}`);
    }
  }

  /**
   * Get the next healthy RPC URL
   */
  private getNextHealthyRpc(startIndex: number = 0): string {
    // Try to find a healthy RPC starting from the given index
    for (let i = startIndex; i < this.rpcUrls.length; i++) {
      const url = this.rpcUrls[i];
      const health = getRpcHealth(url);

      if (canUseRpc(health)) {
        return url;
      }
    }

    // If no healthy RPC found, return first available (fallback behavior)
    logger.warn('No healthy RPC found, using first available as fallback');
    return this.rpcUrls[0];
  }

  /**
   * Execute a contract call with automatic RPC fallback
   */
  async executeWithFallback<T>(
    contractCall: (provider: ethers.JsonRpcProvider) => Promise<T>,
    maxRetries: number = this.rpcUrls.length,
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries && attempt < this.rpcUrls.length; attempt++) {
      const rpcUrl = this.getNextHealthyRpc(attempt);
      const health = getRpcHealth(rpcUrl);

      // Skip if circuit breaker is open
      if (!canUseRpc(health)) {
        logger.debug(`Skipping RPC ${rpcUrl} - circuit breaker open`);
        continue;
      }

      try {
        // Use cached provider - only creates new one if not cached
        const provider = this.getProvider(rpcUrl);

        // Track if we switch to a different RPC
        const rpcChanged = this.currentRpcUrl && this.currentRpcUrl !== rpcUrl;
        if (rpcChanged) {
          logger.warn(`Switching RPC from ${this.currentRpcUrl} to ${rpcUrl}`);
        }
        this.currentRpcUrl = rpcUrl;

        logger.debug(`Attempting contract call with RPC: ${rpcUrl} (attempt ${attempt + 1})`);

        // Create a timeout promise that rejects after the configured timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error(`RPC call timed out after ${CIRCUIT_BREAKER_CONFIG.rpcCallTimeout / 1000} seconds for ${rpcUrl}`));
          }, CIRCUIT_BREAKER_CONFIG.rpcCallTimeout);
        });

        // Race between the contract call and timeout
        const result = await Promise.race([
          contractCall(provider),
          timeoutPromise,
        ]);

        // Mark as successful
        updateCircuitBreaker(health, true);
        logger.debug(`Contract call successful with RPC: ${rpcUrl}`);

        return result;
      }
      catch (error: any) {
        lastError = error;
        logger.warn(`Contract call failed with RPC ${rpcUrl}:`, error?.message);

        // Mark as failed and clear cached provider for this RPC
        updateCircuitBreaker(health, false);
        this.clearProvider(rpcUrl);
      }
    }

    // All RPCs failed
    const errorMessage = `All RPC endpoints failed after ${maxRetries} attempts. Last error: ${lastError?.message}`;
    logger.error(errorMessage);
    throw new Error(errorMessage);
  }
}

// ============================================================================
// SINGLETON MANAGER FUNCTIONS
// ============================================================================

/**
 * Get or create a singleton RPC manager for a specific chain
 */
export function getRpcManager(chainId: number, rpcUrls: readonly string[]): RpcManager {
  let manager = rpcManagers.get(chainId);
  if (!manager) {
    manager = new RpcManager(rpcUrls);
    rpcManagers.set(chainId, manager);
    logger.debug(`Created RPC manager for chain ${chainId} with ${rpcUrls.length} RPCs`);
  }
  return manager;
}
