import type { Address, Log } from 'viem';
import { mock } from '@wagmi/connectors';
import { type Config, createConfig, http } from '@wagmi/core';
import { ok } from 'plainfp/result';
import { mainnet } from 'viem/chains';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getWeb3Client } from '~/modules/web3/client';
import * as coreActions from '~/modules/web3/core/actions';
import * as sponsorshipActions from '~/modules/web3/sponsorship/actions';
import { getSponsorshipClient } from '~/modules/web3/sponsorship/client';

vi.mock('~/modules/web3/core/actions', () => ({
  approveErc20: vi.fn(async () => ok('0xhash')),
  readErc20Allowance: vi.fn(async () => ok('5')),
  sendErc20Transfer: vi.fn(async () => ok('0xhash')),
  sendNativeTransfer: vi.fn(async () => ok('0xhash')),
  waitForReceipt: vi.fn(async () => ok({ status: 'success' })),
}));

vi.mock('~/modules/web3/sponsorship/actions', () => ({
  decodeMintedTokenId: vi.fn(() => '42'),
  mintNft: vi.fn(async () => ok('0xhash')),
  readCurrentReleaseId: vi.fn(async () => ok(3n)),
  readTierSupplies: vi.fn(async () => ok({})),
}));

function testConfig(): Config {
  return createConfig({
    chains: [mainnet],
    connectors: [mock({ accounts: ['0xabcdef0000000000000000000000000000000001'] })],
    transports: { [mainnet.id]: http() },
  });
}

describe('web3 client adapters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWeb3Client', () => {
    it('initializes once and binds core actions to the config', async () => {
      const config = testConfig();
      const ensureInitialized = vi.fn(async () => config);

      const client = await getWeb3Client(ensureInitialized);
      expect(ensureInitialized).toHaveBeenCalledOnce();

      const params = { amount: '1', chainId: 1, decimals: 18, to: '0xRecipient' };
      await client.sendNativeTransfer(params);
      expect(coreActions.sendNativeTransfer).toHaveBeenCalledWith(config, params);

      await client.waitForReceipt('0xhash', 1);
      expect(coreActions.waitForReceipt).toHaveBeenCalledWith(config, '0xhash', 1);

      await client.readErc20Allowance({ chainId: 1, decimals: 6, owner: '0xa', spender: '0xb', token: '0xc' });
      expect(coreActions.readErc20Allowance).toHaveBeenCalledOnce();
    });
  });

  describe('getSponsorshipClient', () => {
    it('binds contract reads/writes to the config', async () => {
      const config = testConfig();
      const ensureInitialized = vi.fn(async () => config);

      const client = await getSponsorshipClient(ensureInitialized);
      const ref = { chainId: 1, contractAddress: '0xContract' };

      await client.readCurrentReleaseId(ref);
      expect(sponsorshipActions.readCurrentReleaseId).toHaveBeenCalledWith(config, ref);

      await client.readTierSupplies(ref, 3n);
      expect(sponsorshipActions.readTierSupplies).toHaveBeenCalledWith(config, ref, 3n);
    });

    it('forwards the pure decodeMintedTokenId without the config', async () => {
      const client = await getSponsorshipClient(async () => testConfig());
      const logs: Log[] = [];
      const minter: Address = '0xabcdef0000000000000000000000000000000001';

      expect(client.decodeMintedTokenId(logs, minter)).toBe('42');
      expect(sponsorshipActions.decodeMintedTokenId).toHaveBeenCalledWith(logs, minter);
    });
  });
});
