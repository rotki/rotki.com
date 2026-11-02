import type { Account } from '@rotki/card-payment-common/schemas/account';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';
import EmailPreferences from '~/components/account/home/EmailPreferences.vue';
import { createAccount, profileUpdateMock } from './account-fixture';

const mockUseProfileUpdate = vi.hoisted(() => vi.fn());

vi.mock('~/composables/account/use-profile-update', () => ({
  useProfileUpdate: mockUseProfileUpdate,
}));

async function mountEmailPreferences(newsletterConsent: boolean) {
  const updateProfile = vi.fn().mockResolvedValue(true);

  mockUseProfileUpdate.mockReturnValue(profileUpdateMock(ref<Account>(createAccount({ newsletterConsent })), updateProfile));

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
