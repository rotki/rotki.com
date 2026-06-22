import type { Chain } from 'viem';
import { arbitrum, arbitrumSepolia, base, baseSepolia, gnosis, mainnet, optimism, optimismSepolia, sepolia } from 'viem/chains';

/**
 * The viem {@link Chain} objects we actually use, keyed by `ChainMeta.viemKey`.
 *
 * These are *static named* imports so Rollup tree-shakes `viem/chains` down to
 * just these definitions instead of bundling all ~700 chains viem ships (a
 * dynamic `Reflect.get(import('viem/chains'), key)` retains the entire barrel).
 * This module is only reached via the lazy `import('./chains-viem')` in
 * {@link loadViemChains}, so viem still stays out of the initial bundle.
 */
export const VIEM_CHAINS: Readonly<Record<string, Chain>> = {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  gnosis,
  mainnet,
  optimism,
  optimismSepolia,
  sepolia,
};
