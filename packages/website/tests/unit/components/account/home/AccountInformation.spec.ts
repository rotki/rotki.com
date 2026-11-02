import type { Account } from '@rotki/card-payment-common/schemas/account';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import AccountInformation from '~/components/account/home/AccountInformation.vue';

const mockUseProfileUpdate = vi.hoisted(() => vi.fn());
const mockCheckVAT = vi.hoisted(() => vi.fn());

vi.mock('~/composables/account/use-profile-update', () => ({
  useProfileUpdate: mockUseProfileUpdate,
}));

vi.mock('~/modules/checkout/composables/use-vat-check', () => ({
  useVatCheck: () => ({
    checkVAT: mockCheckVAT,
    refreshVATCheckStatus: vi.fn(),
  }),
}));

function createAccount(newsletterConsent: boolean): Account {
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
    },
    apiKey: 'api-key',
    apiSecret: 'api-secret',
    canUsePremium: true,
    dateNow: '2026-07-17',
    email: 'alice@example.com',
    emailConfirmed: true,
    hasActiveSubscription: true,
    newsletterConsent,
    username: 'alice',
    vat: 19,
    vatIdStatus: 'Valid',
  };
}

async function mountAccountInformation(newsletterConsent: boolean, saves = true) {
  const updateProfile = vi.fn().mockResolvedValue(saves);
  const account = ref<Account>(createAccount(newsletterConsent));

  mockUseProfileUpdate.mockReturnValue({
    account,
    dismissDone: vi.fn(),
    done: ref<boolean>(false),
    loading: ref<boolean>(false),
    movedOffline: computed<boolean>(() => false),
    updateProfile,
  });

  const wrapper = await mountSuspended(AccountInformation, {
    global: {
      stubs: {
        FloatingNotification: true,
      },
    },
  });

  return { updateProfile, wrapper };
}

describe('account information', () => {
  it('continues to submit the existing customer information fields', async () => {
    const { updateProfile, wrapper } = await mountAccountInformation(false);
    expect(wrapper.get('[data-cy="update-profile"]').attributes('type')).toBe('submit');
    await wrapper.get('form').trigger('submit');

    await vi.waitFor(() => {
      expect(updateProfile).toHaveBeenCalledOnce();
    });
    expect(updateProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        companyName: 'rotki',
        firstName: 'Alice',
        lastName: 'Example',
        vatId: 'DE123456789',
      }),
    );
  });

  it('does not check the VAT ID when saving it failed', async () => {
    const { updateProfile, wrapper } = await mountAccountInformation(false, false);
    const verify = wrapper.findAll('button').find(button => button.text() === 'Verify');
    expect(verify).toBeDefined();
    await verify!.trigger('click');

    await vi.waitFor(() => {
      expect(updateProfile).toHaveBeenCalledOnce();
    });
    expect(mockCheckVAT).not.toHaveBeenCalled();
  });
});
