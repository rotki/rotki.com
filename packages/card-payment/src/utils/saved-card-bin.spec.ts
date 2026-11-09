import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import { PaymentUserError } from '@rotki/sigil';
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

  it('fails with copy the buyer can read when the vault does not have the card', async () => {
    vault.fetchPaymentMethods.mockResolvedValue([{ type: 'CreditCard', details: { lastFour: '4444', bin: '555555' } }]);

    const failure = findSavedCardBin(undefined, card);

    await expect(failure).rejects.toBeInstanceOf(PaymentUserError);
    await expect(failure).rejects.toThrow('We could not find that card.');
    expect(vault.teardown).toHaveBeenCalledOnce();
  });

  it('passes a failed lookup on and still tears down', async () => {
    vault.fetchPaymentMethods.mockRejectedValue(new Error('network'));

    await expect(findSavedCardBin(undefined, card)).rejects.toThrow('network');
    expect(vault.teardown).toHaveBeenCalledOnce();
  });
});
