import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { VueWrapper } from '@vue/test-utils';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive, ref } from 'vue';
import InvoiceDetails from '~/components/account/home/InvoiceDetails.vue';
import { createAccount } from './account-fixture';

/** What the mocked `useMainStore` returns; each mount puts a fresh store here. */
const account = vi.hoisted(() => {
  const holder: { current?: object } = {};
  return holder;
});

vi.mock('~/store', () => ({
  useMainStore: () => account.current,
}));

/** Stands in for one of the two forms: a marker to find it by, and the events the dialog listens to. */
function formStub(name: string, events: string[]) {
  return defineComponent({
    name,
    emits: events,
    setup: () => () => h('div', { 'data-form': name }),
  });
}

const AccountInformation = formStub('AccountInformation', ['saved', 'cancel', 'edit-address']);
const AccountAddress = formStub('AccountAddress', ['saved', 'cancel', 'edit-name']);

const RuiDialog = defineComponent({
  name: 'RuiDialog',
  props: { modelValue: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup: (props, { slots }) => () => (props.modelValue ? h('div', { 'data-dialog': '' }, slots.default?.()) : null),
});

const RuiCard = defineComponent({
  name: 'RuiCard',
  setup: (_, { slots }) => () => h('div', [h('h2', slots.header?.()), slots.default?.()]),
});

async function mountInvoiceDetails(details: Account = createAccount()) {
  account.current = reactive({ account: ref<Account>(details) });
  return mountSuspended(InvoiceDetails, {
    global: {
      stubs: {
        AccountAddress,
        AccountInformation,
        FloatingNotification: { props: ['visible'], template: '<div v-if="visible" data-saved />' },
        RuiCard,
        RuiDialog,
      },
    },
  });
}

async function change(wrapper: VueWrapper, group: 'name and VAT ID' | 'address'): Promise<void> {
  await wrapper.get(`button[aria-label="Change ${group}"]`).trigger('click');
}

/** The form the dialog shows, or undefined when it is closed. */
function shownForm(wrapper: VueWrapper): string | undefined {
  if (!wrapper.find('[data-dialog]').exists())
    return undefined;
  const shown = wrapper.findAll('[data-form]').filter(form => form.element.parentElement?.style.display !== 'none');
  expect(shown).toHaveLength(1);
  return shown[0]!.attributes('data-form');
}

describe('invoice details', () => {
  it('sums up the saved name, VAT ID and address', async () => {
    const wrapper = await mountInvoiceDetails(createAccount({}, { companyName: '', country: 'DE' }));
    const text = wrapper.text();

    expect(text).toContain('Alice Example');
    expect(text).toContain('DE123456789');
    expect(text).toContain('Not set');
    expect(wrapper.findAll('p > span').map(line => line.text())).toEqual(['First street', 'Second street', '10115 Berlin', 'Germany']);
  });

  it('says the address is not set when there is none', async () => {
    const wrapper = await mountInvoiceDetails(createAccount({}, { address1: '', address2: '', city: '', country: '', postcode: '' }));
    expect(wrapper.findAll('p > span')).toHaveLength(0);
    expect(wrapper.text()).toContain('Not set');
  });

  it('opens the group that was asked for', async () => {
    const wrapper = await mountInvoiceDetails();
    expect(shownForm(wrapper)).toBeUndefined();

    await change(wrapper, 'address');
    expect(shownForm(wrapper)).toBe('AccountAddress');
    expect(wrapper.get('[data-dialog] h2').text()).toBe('Address');

    wrapper.getComponent(AccountAddress).vm.$emit('cancel');
    await wrapper.vm.$nextTick();
    expect(shownForm(wrapper)).toBeUndefined();

    await change(wrapper, 'name and VAT ID');
    expect(shownForm(wrapper)).toBe('AccountInformation');
    expect(wrapper.get('[data-dialog] h2').text()).toBe('Name and VAT ID');
  });

  it('comes back to the name after the address it asked for is saved', async () => {
    const wrapper = await mountInvoiceDetails();
    await change(wrapper, 'name and VAT ID');

    wrapper.getComponent(AccountInformation).vm.$emit('edit-address');
    await wrapper.vm.$nextTick();
    expect(shownForm(wrapper)).toBe('AccountAddress');

    wrapper.getComponent(AccountAddress).vm.$emit('saved');
    await wrapper.vm.$nextTick();
    expect(shownForm(wrapper)).toBe('AccountInformation');
    expect(wrapper.find('[data-saved]').exists()).toBe(true);

    wrapper.getComponent(AccountInformation).vm.$emit('saved');
    await wrapper.vm.$nextTick();
    expect(shownForm(wrapper)).toBeUndefined();
  });

  it('forgets the way back when the dialog is closed', async () => {
    const wrapper = await mountInvoiceDetails();
    await change(wrapper, 'name and VAT ID');
    wrapper.getComponent(AccountInformation).vm.$emit('edit-address');
    await wrapper.vm.$nextTick();

    wrapper.getComponent(RuiDialog).vm.$emit('update:modelValue', false);
    await wrapper.vm.$nextTick();
    expect(shownForm(wrapper)).toBeUndefined();

    await change(wrapper, 'address');
    wrapper.getComponent(AccountAddress).vm.$emit('cancel');
    await wrapper.vm.$nextTick();
    expect(shownForm(wrapper)).toBeUndefined();
  });

  it('starts both forms over on every open', async () => {
    const wrapper = await mountInvoiceDetails();
    await change(wrapper, 'name and VAT ID');
    const first = wrapper.getComponent(AccountInformation).vm;

    wrapper.getComponent(AccountInformation).vm.$emit('edit-address');
    await wrapper.vm.$nextTick();
    expect(wrapper.getComponent(AccountInformation).vm).toBe(first);

    wrapper.getComponent(AccountAddress).vm.$emit('cancel');
    wrapper.getComponent(AccountInformation).vm.$emit('cancel');
    await wrapper.vm.$nextTick();
    await change(wrapper, 'name and VAT ID');
    expect(wrapper.getComponent(AccountInformation).vm).not.toBe(first);
  });
});
