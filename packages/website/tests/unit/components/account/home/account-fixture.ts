import type { Account } from '@rotki/card-payment-common/schemas/account';
import { vi } from 'vitest';
import { computed, type Ref, ref } from 'vue';

/** A confirmed account with a full German address, as `GET /webapi/account/` returns it. */
export function createAccount(overrides: Partial<Account> = {}, address: Partial<Account['address']> = {}): Account {
  return {
    address: {
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
      ...address,
    },
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
    ...overrides,
  };
}

/** What a mocked `useProfileUpdate` returns, with the account and the save the test controls. */
export function profileUpdateMock(account: Ref<Account>, updateProfile = vi.fn().mockResolvedValue(true)) {
  return {
    account,
    dismissDone: vi.fn(),
    done: ref<boolean>(false),
    loading: ref<boolean>(false),
    movedOffline: computed<boolean>(() => false),
    updateProfile,
  };
}
