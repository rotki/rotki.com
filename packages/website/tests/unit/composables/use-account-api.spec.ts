import type { Account, Address } from '@rotki/card-payment-common/schemas/account';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAccountApi } from '~/composables/account/use-account-api';

const mockFetchWithCsrf = vi.hoisted(() => vi.fn());

vi.mock('~/composables/use-fetch-with-csrf', () => ({
  useFetchWithCsrf: () => ({
    fetchWithCsrf: mockFetchWithCsrf,
  }),
}));

const address: Address = {
  address1: 'First street',
  address2: 'Second street',
  city: 'Berlin',
  companyName: 'rotki',
  country: 'DE',
  firstName: 'Alice',
  lastName: 'Example',
  movedOffline: false,
  postcode: '10115',
  vatId: 'DE123456789',
};

const account: Account = {
  address,
  apiKey: 'api-key',
  apiSecret: 'api-secret',
  canUsePremium: true,
  dateNow: '2026-07-17',
  email: 'alice@example.com',
  emailConfirmed: true,
  hasActiveSubscription: true,
  newsletterConsent: false,
  username: 'alice',
  vat: 19,
  vatIdStatus: 'Valid',
};

describe('useAccountApi', () => {
  afterEach(() => {
    mockFetchWithCsrf.mockReset();
  });

  it('reads the required newsletter consent from the account response', async () => {
    mockFetchWithCsrf.mockResolvedValue({ result: account });

    const result = await useAccountApi().getAccount();

    expect(result?.newsletterConsent).toBe(false);
  });

  it('returns the updated newsletter consent and address from the PATCH response', async () => {
    mockFetchWithCsrf.mockResolvedValue({
      result: {
        address,
        newsletterConsent: true,
      },
    });

    const result = await useAccountApi().updateProfile({
      firstName: 'Alice',
      newsletterConsent: true,
    });

    expect(mockFetchWithCsrf).toHaveBeenCalledWith('/webapi/account/', {
      body: {
        firstName: 'Alice',
        newsletterConsent: true,
      },
      method: 'PATCH',
    });
    expect(result).toEqual({
      profile: {
        address,
        newsletterConsent: true,
      },
      success: true,
    });
  });
});
