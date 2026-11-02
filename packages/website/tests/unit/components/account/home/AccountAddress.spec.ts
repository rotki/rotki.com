import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { VueWrapper } from '@vue/test-utils';
import type { FieldErrors, ZodForm } from '~/composables/use-zod-form';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import AccountAddress from '~/components/account/home/AccountAddress.vue';
import { createAccount, profileUpdateMock } from './account-fixture';

const mockUseProfileUpdate = vi.hoisted(() => vi.fn());

vi.mock('~/composables/account/use-profile-update', async importOriginal => ({
  ...await importOriginal<typeof import('~/composables/account/use-profile-update')>(),
  useProfileUpdate: mockUseProfileUpdate,
}));

/** A save the backend rejects with `errors`, on fields this form may not have. */
function rejectWith(errors: FieldErrors) {
  return vi.fn(async (form: Pick<ZodForm<string>, 'setExternalErrors'>): Promise<boolean> => {
    form.setExternalErrors(errors);
    return false;
  });
}

async function mountAccountAddress(updateProfile = vi.fn().mockResolvedValue(true)) {
  mockUseProfileUpdate.mockReturnValue(profileUpdateMock(ref<Account>(createAccount()), updateProfile));

  const wrapper = await mountSuspended(AccountAddress, {
    global: {
      stubs: {
        CountrySelect: true,
      },
    },
  });
  return { updateProfile, wrapper };
}

function findButton(wrapper: VueWrapper, text: string) {
  return wrapper.findAll('button').find(button => button.text() === text);
}

async function submit(wrapper: VueWrapper, updateProfile: ReturnType<typeof vi.fn>): Promise<void> {
  await wrapper.get('form').trigger('submit');
  await vi.waitFor(() => {
    expect(updateProfile).toHaveBeenCalledOnce();
  });
  await nextTick();
}

describe('account address', () => {
  it('sends the saved address and reports the save', async () => {
    const { updateProfile, wrapper } = await mountAccountAddress();
    await submit(wrapper, updateProfile);

    expect(updateProfile).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ address1: 'First street', city: 'Berlin', country: 'DE', postcode: '10115' }),
    );
    expect(wrapper.emitted('saved')).toHaveLength(1);
  });

  it('points to the name form when the save fails on the VAT ID', async () => {
    const updateProfile = rejectWith({ vatId: ['Enter a valid VAT ID.'] });
    const { wrapper } = await mountAccountAddress(updateProfile);
    await submit(wrapper, updateProfile);

    expect(wrapper.text()).toContain('Your name or VAT ID is missing or invalid.');
    expect(wrapper.text()).toContain('Enter a valid VAT ID.');
    expect(findButton(wrapper, 'Save')!.attributes('disabled')).toBeUndefined();

    await findButton(wrapper, 'Edit name and VAT ID')!.trigger('click');
    expect(wrapper.emitted('edit-name')).toHaveLength(1);
    expect(wrapper.emitted('saved')).toBeUndefined();
  });

  it('shows an error from no form without sending the user elsewhere', async () => {
    const updateProfile = rejectWith({ nonFieldErrors: ['Try again later.'] });
    const { wrapper } = await mountAccountAddress(updateProfile);
    await submit(wrapper, updateProfile);

    expect(wrapper.text()).toContain('Try again later.');
    expect(findButton(wrapper, 'Edit name and VAT ID')).toBeUndefined();
  });

  it('asks the parent to close on Cancel', async () => {
    const { wrapper } = await mountAccountAddress();
    await findButton(wrapper, 'Cancel')!.trigger('click');
    expect(wrapper.emitted('cancel')).toHaveLength(1);
  });
});
