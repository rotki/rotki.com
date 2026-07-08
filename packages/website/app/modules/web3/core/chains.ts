import type { Chain } from 'viem';

/**
 * Pure chain registry — the single source of truth for the networks the app
 * supports.
 *
 * This module is intentionally free of any heavy runtime import: it only holds
 * plain metadata plus a `import type { Chain }`. The actual viem chain objects
 * (which carry RPC URLs and pull viem) are resolved lazily via
 * {@link loadViemChains} so nothing here lands in the initial bundle.
 */
export interface ChainMeta {
  readonly id: number;
  readonly name: string;
  readonly blockExplorerUrl: string;
  readonly testnet: boolean;
  /** Export name of this chain in `viem/chains`. */
  readonly viemKey: string;
  /**
   * Extra RPC URLs for a viem `fallback` transport (replaces the old
   * circuit-breaker rpc-checker). When absent, the chain's default viem RPC is
   * used. Currently populated for the sponsorship chains.
   */
  readonly rpcUrls?: readonly string[];
  /**
   * OP-stack (Optimism Superchain) rollup: the total tx fee is the L2 execution
   * fee PLUS a separate L1 data fee. Gas estimation must add the L1 component or
   * it badly underestimates the real cost. {@link isOpStackChain}.
   */
  readonly opStack?: boolean;
}

// Curated public RPCs per chain, used by viem's `fallback` transport. Every host
// here MUST also be listed in the backend CSP `connect-src`
// (backend/internal/csp/policies.go) or the browser blocks the read and balances
// silently come back empty. Keep the two in sync.
//
// `ETHEREUM_RPCS` is exported because reverse-ENS resolution (`core/ens.ts`) runs
// on mainnet via a standalone viem client and reuses these same already-allowed
// hosts — ENS is mainnet-only, so it can't rely on the wagmi config, which omits
// mainnet in testnet mode.
export const ETHEREUM_RPCS = [
  'https://ethereum-rpc.publicnode.com',
  'https://rpc.mevblocker.io',
  'https://eth.drpc.org',
];

const ARBITRUM_RPCS = [
  'https://arbitrum-one-rpc.publicnode.com',
  'https://arb1.arbitrum.io/rpc',
  'https://arbitrum.drpc.org',
];

const BASE_RPCS = [
  'https://base-rpc.publicnode.com',
  'https://mainnet.base.org',
  'https://base.drpc.org',
];

const OPTIMISM_RPCS = [
  'https://optimism-rpc.publicnode.com',
  'https://mainnet.optimism.io',
  'https://optimism.drpc.org',
];

const GNOSIS_RPCS = [
  'https://gnosis-rpc.publicnode.com',
  'https://rpc.gnosischain.com',
  'https://gnosis.drpc.org',
];

const SEPOLIA_RPCS = [
  'https://sepolia.gateway.tenderly.co',
  'https://sepolia.drpc.org',
  'https://ethereum-sepolia-rpc.publicnode.com',
];

const ARBITRUM_SEPOLIA_RPCS = [
  'https://arbitrum-sepolia-rpc.publicnode.com',
  'https://arbitrum-sepolia.drpc.org',
];

const BASE_SEPOLIA_RPCS = [
  'https://base-sepolia-rpc.publicnode.com',
  'https://sepolia.base.org',
  'https://base-sepolia.drpc.org',
];

const OPTIMISM_SEPOLIA_RPCS = [
  'https://optimism-sepolia-rpc.publicnode.com',
  'https://sepolia.optimism.io',
  'https://optimism-sepolia.drpc.org',
];

const PRODUCTION_CHAINS: readonly ChainMeta[] = [
  { blockExplorerUrl: 'https://etherscan.io', id: 1, name: 'Ethereum', rpcUrls: ETHEREUM_RPCS, testnet: false, viemKey: 'mainnet' },
  { blockExplorerUrl: 'https://arbiscan.io', id: 42161, name: 'Arbitrum One', rpcUrls: ARBITRUM_RPCS, testnet: false, viemKey: 'arbitrum' },
  { blockExplorerUrl: 'https://basescan.org', id: 8453, name: 'Base', opStack: true, rpcUrls: BASE_RPCS, testnet: false, viemKey: 'base' },
  { blockExplorerUrl: 'https://optimistic.etherscan.io', id: 10, name: 'OP Mainnet', opStack: true, rpcUrls: OPTIMISM_RPCS, testnet: false, viemKey: 'optimism' },
  { blockExplorerUrl: 'https://gnosisscan.io', id: 100, name: 'Gnosis', rpcUrls: GNOSIS_RPCS, testnet: false, viemKey: 'gnosis' },
];

const TEST_CHAINS: readonly ChainMeta[] = [
  { blockExplorerUrl: 'https://sepolia.etherscan.io', id: 11155111, name: 'Sepolia', rpcUrls: SEPOLIA_RPCS, testnet: true, viemKey: 'sepolia' },
  { blockExplorerUrl: 'https://sepolia.arbiscan.io', id: 421614, name: 'Arbitrum Sepolia', rpcUrls: ARBITRUM_SEPOLIA_RPCS, testnet: true, viemKey: 'arbitrumSepolia' },
  { blockExplorerUrl: 'https://sepolia.basescan.org', id: 84532, name: 'Base Sepolia', opStack: true, rpcUrls: BASE_SEPOLIA_RPCS, testnet: true, viemKey: 'baseSepolia' },
  { blockExplorerUrl: 'https://sepolia-optimism.etherscan.io', id: 11155420, name: 'Optimism Sepolia', opStack: true, rpcUrls: OPTIMISM_SEPOLIA_RPCS, testnet: true, viemKey: 'optimismSepolia' },
];

export const ALL_CHAINS: readonly ChainMeta[] = [...PRODUCTION_CHAINS, ...TEST_CHAINS];

/** Metadata for the chains available in the given environment. */
export function chainsFor(testing: boolean): readonly ChainMeta[] {
  return testing ? TEST_CHAINS : PRODUCTION_CHAINS;
}

/** Look up a chain's metadata by numeric id, across all environments. */
export function getChainMeta(id: number | undefined): ChainMeta | undefined {
  if (id === undefined)
    return undefined;
  return ALL_CHAINS.find(chain => chain.id === id);
}

/** Build a block-explorer transaction URL, or `undefined` if the chain is unknown. */
export function blockExplorerTxUrl(chainId: number | undefined, hash: string): string | undefined {
  const meta = getChainMeta(chainId);
  return meta ? `${meta.blockExplorerUrl}/tx/${hash}` : undefined;
}

/** True for OP-stack rollups, whose fee includes an L1 data component on top of L2 gas. */
export function isOpStackChain(chainId: number | undefined): boolean {
  return getChainMeta(chainId)?.opStack === true;
}

/**
 * Lazily resolve the viem {@link Chain} objects for the given environment.
 * Pulls `viem/chains` only when called (config build time), keeping viem out of
 * the initial bundle.
 */
export async function loadViemChains(testing: boolean): Promise<[Chain, ...Chain[]]> {
  // Import the curated map (static `viem/chains` named imports) rather than the
  // full barrel, so only the chains we use are bundled. See `chains-viem.ts`.
  const { VIEM_CHAINS } = await import('./chains-viem');
  const resolved = chainsFor(testing)
    .map((meta): Chain | undefined => VIEM_CHAINS[meta.viemKey])
    .filter((chain): chain is Chain => chain !== undefined);

  const [first, ...rest] = resolved;
  if (!first)
    throw new Error('No viem chains resolved for the current environment');
  return [first, ...rest];
}
