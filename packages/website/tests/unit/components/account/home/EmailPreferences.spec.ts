import type { Account } from '@rotki/card-payment-common/schemas/account';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { computed, ref } from 'vue';
import EmailPreferences from '~/components/account/home/EmailPreferences.vue';

const mockUseProfileUpdate = vi.hoisted(() => vi.fn());

vi.mock('~/composables/account/use-profile-update', () => ({
  useProfileUpdate: mockUseProfileUpdate,
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

async function mountEmailPreferences(newsletterConsent: boolean) {
  const updateProfile = vi.fn().mockResolvedValue(true);

  mockUseProfileUpdate.mockReturnValue({
    account: ref<Account>(createAccount(newsletterConsent)),
    dismissDone: vi.fn(),
    done: ref<boolean>(false),
    loading: ref<boolean>(false),
    movedOffline: computed<boolean>(() => false),
    updateProfile,
  });

  const wrapper = await mountSuspended(EmailPreferences, {
    global: {
      stubs: {
        FloatingNotification: true,
      },
    },
  });

  return { updateProfile, wrapper };
}

describe('email preferences', () => {
  it.each([false, true])('initializes newsletter consent to %s from account data', async (newsletterConsent) => {
    const { wrapper } = await mountEmailPreferences(newsletterConsent);

    expect(wrapper.get<HTMLInputElement>('#newsletter-consent').element.checked).toBe(newsletterConsent);
  });

  it.each([false, true])('saves newsletter consent as %s as soon as the switch flips', async (newsletterConsent) => {
    const { updateProfile, wrapper } = await mountEmailPreferences(!newsletterConsent);
    await wrapper.get<HTMLInputElement>('#newsletter-consent').setValue(newsletterConsent);

    await vi.waitFor(() => {
      expect(updateProfile).toHaveBeenCalledOnce();
    });
    expect(updateProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ newsletterConsent }),
    );
  });

  it('flips the switch back when the save fails', async () => {
    const { updateProfile, wrapper } = await mountEmailPreferences(false);
    updateProfile.mockResolvedValueOnce(false);
    const toggle = wrapper.get<HTMLInputElement>('#newsletter-consent');
    await toggle.setValue(true);

    await vi.waitFor(() => {
      expect(toggle.element.checked).toBe(false);
    });
  });
});
