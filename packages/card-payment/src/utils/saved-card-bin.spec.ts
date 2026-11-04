import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { findSavedCardBin } from './saved-card-bin';

const vault = vi.hoisted(() => ({
  fetchPaymentMethods: vi.fn(),
  teardown: vi.fn(),
}));

vi.mock('braintree-web/vault-manager', () => ({
  create: vi.fn(async () => vault),
}));

const card: SavedCard = { expiresAt: '12/30', imageUrl: '', last4: '1111', linked: true, token: 'tok-1' };

describe('utils/saved-card-bin', () => {
  beforeEach(() => {
    vault.fetchPaymentMethods.mockReset();
    vault.teardown.mockReset().mockResolvedValue(undefined);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns the bin of the vaulted card with the same last four digits', async () => {
    vault.fetchPaymentMethods.mockResolvedValue([
      { type: 'PayPalAccount', details: { email: 'a@example.com' } },
      { type: 'CreditCard', details: { lastFour: '4444', bin: '555555' } },
      { type: 'CreditCard', details: { lastFour: '1111', bin: '411111' } },
    ]);

    await expect(findSavedCardBin(undefined, card)).resolves.toBe('411111');
    expect(vault.teardown).toHaveBeenCalledOnce();
  });

  it('returns an empty bin when no vaulted card matches', async () => {
    vault.fetchPaymentMethods.mockResolvedValue([{ type: 'CreditCard', details: { lastFour: '4444', bin: '555555' } }]);

    await expect(findSavedCardBin(undefined, card)).resolves.toBe('');
  });

  it('returns an empty bin and still tears down when the vault lookup fails', async () => {
    vault.fetchPaymentMethods.mockRejectedValue(new Error('network'));

    await expect(findSavedCardBin(undefined, card)).resolves.toBe('');
    expect(vault.teardown).toHaveBeenCalledOnce();
  });
});
