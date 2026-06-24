/**
 * Session cache for reverse-ENS results, split out from `core/ens` (which statically
 * pulls in viem and so is only ever dynamically imported). Keeping the cache here, in
 * a viem-free module, lets the composable peek it *synchronously* on first render and
 * seed the already-known name without flickering to the truncated address — no
 * debounce wait, no dynamic import, no RPC.
 *
 * Lives for the page session only (module state, no persistence) with no expiry — a
 * primary name is stable per address and changes rarely enough that a page reload is a
 * fine refresh point. Keyed by lower-cased address; checksumming is only needed for the
 * RPC call itself, not for cache identity.
 */
const cache = new Map<string, string | undefined>();

export interface CachedEnsName {
  /** Whether the address has a cached result — distinguishes a cached `undefined` miss from an absent key. */
  readonly hit: boolean;
  /** The cached name, or `undefined` for a cached "no primary name" result. */
  readonly name: string | undefined;
}

/** Synchronously read the cached name for an address, if any. */
export function peekEnsName(address: string): CachedEnsName {
  const key = address.toLowerCase();
  return { hit: cache.has(key), name: cache.get(key) };
}

/** Cache a resolved result. Both hits and confirmed misses (`undefined`) are stored. */
export function cacheEnsName(address: string, name: string | undefined): void {
  cache.set(address.toLowerCase(), name);
}

/** Drop all cached names. Intended for tests, which otherwise leak state across cases. */
export function resetEnsCache(): void {
  cache.clear();
}
