import type { Account, Address } from '@rotki/card-payment-common/schemas/account';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import { useProfileUpdate } from '~/composables/account/use-profile-update';
import { useMainStore } from '~/store';

const mockUpdateProfile = vi.hoisted(() => vi.fn());
const mockRequestRefresh = vi.hoisted(() => vi.fn());

vi.mock('~/composables/account/use-account-api', () => ({
  useAccountApi: () => ({
    updateProfile: mockUpdateProfile,
  }),
}));

vi.mock('~/composables/use-app-events', () => ({
  useAccountRefresh: () => ({
    onRefresh: vi.fn(),
    requestRefresh: mockRequestRefresh,
  }),
}));

const initialAddress: Address = {
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

function createAccount(): Account {
  return {
    address: initialAddress,
    apiKey: 'api-key',
    apiSecret: 'api-secret',
    canUsePremium: true,
    dateNow: '2026-07-17',
    email: 'alice@example.com',
    emailConfirmed: true,
    hasActiveSubscription: true,
    newsletterConsent: true,
    username: 'alice',
    vat: 19,
    vatIdStatus: 'Valid',
  };
}

describe('useProfileUpdate', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockUpdateProfile.mockReset();
    mockRequestRefresh.mockReset();
  });

  it('updates local profile state from the PATCH response', async () => {
    const store = useMainStore();
    store.account = createAccount();
    const responseAddress: Address = {
      ...initialAddress,
      companyName: 'Updated company',
      firstName: 'Updated',
    };
    mockUpdateProfile.mockResolvedValue({
      profile: {
        address: responseAddress,
        newsletterConsent: false,
      },
      success: true,
    });
    const validation = ref<{ $validate: () => Promise<boolean> }>({
      $validate: vi.fn().mockResolvedValue(true),
    });
    const { updateProfile } = useProfileUpdate();

    const success = await updateProfile(validation, {
      firstName: 'Updated',
      newsletterConsent: false,
    });

    expect(success).toBe(true);
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      address1: initialAddress.address1,
      address2: initialAddress.address2,
      city: initialAddress.city,
      companyName: initialAddress.companyName,
      country: initialAddress.country,
      firstName: 'Updated',
      lastName: initialAddress.lastName,
      newsletterConsent: false,
      postcode: initialAddress.postcode,
      vatId: initialAddress.vatId,
    });
    expect(store.account).toMatchObject({
      address: responseAddress,
      newsletterConsent: false,
    });
    expect(mockRequestRefresh).toHaveBeenCalledOnce();
  });
});
