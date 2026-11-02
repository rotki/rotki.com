import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { VueWrapper } from '@vue/test-utils';
import type { ZodForm } from '~/composables/use-zod-form';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { nextTick, ref } from 'vue';
import AccountInformation from '~/components/account/home/AccountInformation.vue';
import { createAccount, profileUpdateMock } from './account-fixture';

const mockUseProfileUpdate = vi.hoisted(() => vi.fn());
const mockCheckVAT = vi.hoisted(() => vi.fn());

vi.mock('~/composables/account/use-profile-update', async importOriginal => ({
  ...await importOriginal<typeof import('~/composables/account/use-profile-update')>(),
  useProfileUpdate: mockUseProfileUpdate,
}));

vi.mock('~/modules/checkout/composables/use-vat-check', () => ({
  useVatCheck: () => ({
    checkVAT: mockCheckVAT,
    refreshVATCheckStatus: vi.fn(),
  }),
}));

/** A save the backend rejects because of the stored postcode, the way a name save fails without an address. */
async function rejectOnPostcode(form: Pick<ZodForm<string>, 'setExternalErrors'>): Promise<boolean> {
  form.setExternalErrors({ postcode: ['This field may not be blank.'] });
  return false;
}

async function mountAccountInformation(account: Account = createAccount(), updateProfile = vi.fn().mockResolvedValue(true)) {
  const accountRef = ref<Account>(account);
  mockUseProfileUpdate.mockReturnValue(profileUpdateMock(accountRef, updateProfile));

  const wrapper = await mountSuspended(AccountInformation);
  return { account: accountRef, updateProfile, wrapper };
}

function findButton(wrapper: VueWrapper, text: string) {
  return wrapper.findAll('button').find(button => button.text() === text);
}

describe('account information', () => {
  it('continues to submit the existing customer information fields', async () => {
    const { updateProfile, wrapper } = await mountAccountInformation();
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
    expect(wrapper.emitted('saved')).toHaveLength(1);
  });

  it('does not check the VAT ID when saving it failed', async () => {
    const { updateProfile, wrapper } = await mountAccountInformation(createAccount(), vi.fn().mockResolvedValue(false));
    const verify = findButton(wrapper, 'Verify');
    expect(verify).toBeDefined();
    await verify!.trigger('click');

    await vi.waitFor(() => {
      expect(updateProfile).toHaveBeenCalledOnce();
    });
    expect(mockCheckVAT).not.toHaveBeenCalled();
    expect(wrapper.emitted('saved')).toBeUndefined();
  });

  it('asks for the address first when the account has none', async () => {
    const { wrapper } = await mountAccountInformation(createAccount({}, { address1: '', city: '', postcode: '' }));

    expect(wrapper.text()).toContain('Add your address first.');
    await findButton(wrapper, 'Add address')!.trigger('click');
    expect(wrapper.emitted('edit-address')).toHaveLength(1);
  });

  it('shows a save rejected on the address and keeps Save usable', async () => {
    const { updateProfile, wrapper } = await mountAccountInformation(createAccount(), vi.fn(rejectOnPostcode));
    await wrapper.get('form').trigger('submit');
    await vi.waitFor(() => {
      expect(updateProfile).toHaveBeenCalledOnce();
    });
    await nextTick();

    expect(wrapper.text()).toContain('Your address is missing or invalid.');
    expect(wrapper.text()).toContain('This field may not be blank.');
    expect(wrapper.get('[data-cy="update-profile"]').attributes('disabled')).toBeUndefined();

    await findButton(wrapper, 'Edit address')!.trigger('click');
    expect(wrapper.emitted('edit-address')).toHaveLength(1);
    expect(wrapper.emitted('saved')).toBeUndefined();
  });

  it('drops the address error once the address is saved', async () => {
    const { account, wrapper } = await mountAccountInformation(createAccount(), vi.fn(rejectOnPostcode));
    await wrapper.get('form').trigger('submit');
    await vi.waitFor(() => {
      expect(wrapper.text()).toContain('Your address is missing or invalid.');
    });

    account.value = createAccount({}, { postcode: '10117' });
    await nextTick();

    expect(wrapper.text()).not.toContain('Your address is missing or invalid.');
  });
});
