import { isErr, isOk } from 'plainfp/result';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearEnsCache, resolveEnsName } from '~/modules/web3/core/ens';

// vitalik.eth — lowercased input so we can assert the call is checksummed.
const ADDRESS_LOWER = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045';
const ADDRESS_CHECKSUMMED = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';

const getEnsName = vi.hoisted(() => vi.fn());

// Replace the viem client factory so reverse resolution never hits the network.
// `getAddress` stays real so checksumming is exercised, not stubbed away.
vi.mock('viem', async (importOriginal) => {
  const actual = await importOriginal<typeof import('viem')>();
  return {
    ...actual,
    createPublicClient: () => ({ getEnsName }),
  };
});

describe('web3 core/ens', () => {
  beforeEach(() => {
    getEnsName.mockReset();
    clearEnsCache();
  });

  describe('resolveEnsName', () => {
    it('resolves to the primary ENS name on success', async () => {
      getEnsName.mockResolvedValue('vitalik.eth');

      const result = await resolveEnsName(ADDRESS_LOWER);

      expect(isOk(result)).toBe(true);
      expect(isOk(result) && result.value).toBe('vitalik.eth');
    });

    it('queries with the checksummed address', async () => {
      getEnsName.mockResolvedValue('vitalik.eth');

      await resolveEnsName(ADDRESS_LOWER);

      expect(getEnsName).toHaveBeenCalledWith({ address: ADDRESS_CHECKSUMMED });
    });

    it('maps a missing name (viem null) to undefined', async () => {
      getEnsName.mockResolvedValue(null);

      const result = await resolveEnsName(ADDRESS_LOWER);

      expect(isOk(result)).toBe(true);
      expect(isOk(result) && result.value).toBeUndefined();
    });

    it('turns an RPC/transport failure into a typed Web3Error', async () => {
      getEnsName.mockRejectedValue(new Error('rpc down'));

      const result = await resolveEnsName(ADDRESS_LOWER);

      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error._tag).toBe('TxFailed');
        expect(result.error.message).toBe('rpc down');
      }
    });

    it('serves a repeat lookup from cache without a second RPC call', async () => {
      getEnsName.mockResolvedValue('vitalik.eth');

      const first = await resolveEnsName(ADDRESS_LOWER);
      const second = await resolveEnsName(ADDRESS_LOWER);

      expect(isOk(second) && second.value).toBe('vitalik.eth');
      expect(isOk(first) && first.value).toBe('vitalik.eth');
      expect(getEnsName).toHaveBeenCalledTimes(1);
    });

    it('caches a confirmed miss (undefined) so it is not re-queried', async () => {
      getEnsName.mockResolvedValue(null);

      await resolveEnsName(ADDRESS_LOWER);
      const result = await resolveEnsName(ADDRESS_LOWER);

      expect(isOk(result) && result.value).toBeUndefined();
      expect(getEnsName).toHaveBeenCalledTimes(1);
    });

    it('does not cache a failure — a later call retries', async () => {
      getEnsName.mockRejectedValueOnce(new Error('rpc down')).mockResolvedValue('vitalik.eth');

      const failed = await resolveEnsName(ADDRESS_LOWER);
      const retried = await resolveEnsName(ADDRESS_LOWER);

      expect(isErr(failed)).toBe(true);
      expect(isOk(retried) && retried.value).toBe('vitalik.eth');
      expect(getEnsName).toHaveBeenCalledTimes(2);
    });

    it('shares one in-flight request between concurrent callers', async () => {
      getEnsName.mockResolvedValue('vitalik.eth');

      const [a, b] = await Promise.all([
        resolveEnsName(ADDRESS_LOWER),
        resolveEnsName(ADDRESS_LOWER),
      ]);

      expect(isOk(a) && a.value).toBe('vitalik.eth');
      expect(isOk(b) && b.value).toBe('vitalik.eth');
      expect(getEnsName).toHaveBeenCalledTimes(1);
    });
  });
});
