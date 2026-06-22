import { describe, expect, it } from 'vitest';
import {
  ALL_CHAINS,
  blockExplorerTxUrl,
  chainsFor,
  getChainMeta,
  isOpStackChain,
  loadViemChains,
} from '~/modules/web3/core/chains';

describe('web3 core/chains', () => {
  describe('getChainMeta', () => {
    it('resolves known chains by id', () => {
      expect(getChainMeta(1)?.name).toBe('Ethereum');
      expect(getChainMeta(11155111)?.name).toBe('Sepolia');
    });

    it('returns undefined for unknown or missing ids', () => {
      expect(getChainMeta(999999)).toBeUndefined();
      expect(getChainMeta(undefined)).toBeUndefined();
    });
  });

  describe('blockExplorerTxUrl', () => {
    it('builds a tx url for a known chain', () => {
      expect(blockExplorerTxUrl(1, '0xabc')).toBe('https://etherscan.io/tx/0xabc');
    });

    it('returns undefined for an unknown chain', () => {
      expect(blockExplorerTxUrl(999999, '0xabc')).toBeUndefined();
    });
  });

  describe('supported chain set', () => {
    it('exposes exactly the supported production chains', () => {
      expect(chainsFor(false).map(chain => chain.id).sort((a, b) => a - b))
        .toEqual([1, 10, 100, 8453, 42161]);
    });

    it('exposes exactly the supported testnets (incl. Optimism Sepolia)', () => {
      expect(chainsFor(true).map(chain => chain.id).sort((a, b) => a - b))
        .toEqual([84532, 421614, 11155111, 11155420]);
    });

    it('gives every chain explicit rpcUrls (so reads are not CSP-blocked)', () => {
      for (const chain of ALL_CHAINS)
        expect(chain.rpcUrls?.length, chain.name).toBeGreaterThan(0);
    });
  });

  describe('isOpStackChain', () => {
    it('is true for OP-stack rollups (Optimism, Base + their testnets)', () => {
      expect(isOpStackChain(10)).toBe(true); // OP Mainnet
      expect(isOpStackChain(8453)).toBe(true); // Base
      expect(isOpStackChain(11155420)).toBe(true); // Optimism Sepolia
      expect(isOpStackChain(84532)).toBe(true); // Base Sepolia
    });

    it('is false for non-OP-stack chains and unknown ids', () => {
      expect(isOpStackChain(1)).toBe(false); // Ethereum
      expect(isOpStackChain(100)).toBe(false); // Gnosis
      expect(isOpStackChain(42161)).toBe(false); // Arbitrum (not OP-stack)
      expect(isOpStackChain(undefined)).toBe(false);
    });
  });

  describe('chainsFor', () => {
    it('returns only mainnets in production', () => {
      const chains = chainsFor(false);
      expect(chains.length).toBeGreaterThan(0);
      expect(chains.every(chain => !chain.testnet)).toBe(true);
      expect(chains.some(chain => chain.id === 1)).toBe(true);
    });

    it('returns only testnets in testing', () => {
      const chains = chainsFor(true);
      expect(chains.length).toBeGreaterThan(0);
      expect(chains.every(chain => chain.testnet)).toBe(true);
      expect(chains.some(chain => chain.id === 11155111)).toBe(true);
    });

    it('exposes the union of testnet and mainnet chains', () => {
      expect(ALL_CHAINS).toHaveLength(chainsFor(true).length + chainsFor(false).length);
    });
  });

  describe('loadViemChains', () => {
    it('resolves production viem chains with Ethereum first', async () => {
      const chains = await loadViemChains(false);
      expect(chains[0].id).toBe(1);
      expect(chains.length).toBeGreaterThan(1);
    });

    it('resolves test viem chains with Sepolia first', async () => {
      const chains = await loadViemChains(true);
      expect(chains[0].id).toBe(11155111);
    });
  });
});
