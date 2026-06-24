import { ok, type Result, tap } from 'plainfp/result';
import { fromPromise } from 'plainfp/result-async';
import { createPublicClient, fallback, getAddress, http, type PublicClient } from 'viem';
import { mainnet } from 'viem/chains';
import { ETHEREUM_RPCS } from './chains';
import { cacheEnsName, peekEnsName, resetEnsCache } from './ens-cache';
import { fromCause, type Web3Error } from './errors';

/**
 * Per-request RPC timeout for the reverse-ENS lookup. Kept short — the name is a
 * best-effort cosmetic enhancement to the connected-wallet card, never a blocker,
 * so a stalled endpoint should fail fast and let the `fallback` transport advance.
 */
const ENS_TIMEOUT_MS = 10_000;

/**
 * Standalone mainnet viem client, decoupled from the wagmi `Config`. ENS lives on
 * Ethereum mainnet only, but the wagmi config omits mainnet in testnet mode — so
 * reverse resolution can't go through `core/actions`. It reuses `ETHEREUM_RPCS`,
 * whose hosts are already in the backend CSP `connect-src`, so no extra origins.
 *
 * Memoized: the first call builds the client (and its `fallback` transport); later
 * calls reuse it. This module pulls viem statically, so it must only ever be
 * reached through a dynamic import (see `use-ens-name`) to stay out of the bundle.
 */
let client: PublicClient | undefined;

function ensClient(): PublicClient {
  if (!client) {
    client = createPublicClient({
      chain: mainnet,
      transport: fallback(ETHEREUM_RPCS.map(url => http(url, { timeout: ENS_TIMEOUT_MS }))),
    });
  }
  return client;
}

/**
 * In-flight lookups, keyed by checksummed address, so concurrent callers for the same
 * address share one RPC round-trip instead of fanning out duplicate requests.
 */
const inflight = new Map<string, Promise<Result<string | undefined, Web3Error>>>();

/**
 * Reverse-resolve an address to its primary ENS name. Resolves to `undefined`
 * when the address has no name set (viem returns `null`); any RPC/transport
 * failure becomes a typed {@link Web3Error} the caller can swallow.
 *
 * Backed by the session cache (see `ens-cache`) and in-flight dedup, so a fresh
 * lookup only happens on a cache miss with no request already running. Successful
 * results — including confirmed misses — are cached; errors are not, so a transient
 * RPC failure retries on the next call.
 */
export async function resolveEnsName(address: string): Promise<Result<string | undefined, Web3Error>> {
  const cached = peekEnsName(address);
  if (cached.hit)
    return ok(cached.name);

  const key = getAddress(address);
  let pending = inflight.get(key);
  if (!pending) {
    pending = fromPromise(
      ensClient().getEnsName({ address: key }).then(name => name ?? undefined),
      cause => fromCause(cause, 'TxFailed'),
    )
      .then(result => tap(result, (name) => {
        cacheEnsName(address, name);
      }))
      .finally(() => {
        inflight.delete(key);
      });
    inflight.set(key, pending);
  }

  return pending;
}

/**
 * Drop all cached names and in-flight lookups. Intended for tests, which share this
 * module's state across cases and otherwise leak a cached result from one into the next.
 */
export function clearEnsCache(): void {
  resetEnsCache();
  inflight.clear();
}
