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
    $externalResults: ref<Record<string, string[]>>({}),
    account: ref<Account>(createAccount(newsletterConsent)),
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

  it.each([false, true])('submits newsletter consent as %s', async (newsletterConsent) => {
    const { updateProfile, wrapper } = await mountEmailPreferences(!newsletterConsent);
    await wrapper.get<HTMLInputElement>('#newsletter-consent').setValue(newsletterConsent);
    await wrapper.get('[data-cy="update-email-preferences"]').trigger('click');

    await vi.waitFor(() => {
      expect(updateProfile).toHaveBeenCalledOnce();
    });
    expect(updateProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ newsletterConsent }),
    );
  });
});
