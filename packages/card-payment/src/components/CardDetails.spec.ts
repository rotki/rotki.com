import type { SavedCard } from '@rotki/card-payment-common/schemas/payment';
import type { Client } from 'braintree-web/client';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import CardDetails from './CardDetails.vue';

const client: Client = { authorization: 'client-token', getConfiguration: vi.fn(), request: vi.fn(), teardown: vi.fn() };

const tokenize = vi.fn(async () => ({ bin: '411111', nonce: 'nonce-1' }));

const HostedCardForm = defineComponent({
  name: 'HostedCardForm',
  props: { createFields: { type: Function, required: true }, disabled: Boolean },
  emits: ['validation-change', 'error'],
  setup(_, { expose }) {
    expose({ tokenize });
    return () => h('div', { 'data-cy': 'new-card-form' });
  },
});

function card(token: string, last4: string): SavedCard {
  return { expiresAt: '11/2029', imageUrl: '', last4, linked: false, token };
}

type Props = InstanceType<typeof CardDetails>['$props'];

const stubs = {
  AddCardDialog: true,
  CardSelectionDialog: true,
  HostedCardForm,
  SavedCardDisplay: { props: ['card'], template: '<div data-cy="saved-card">{{ card.last4 }}</div>' },
};

function mountDetails(props: Partial<Props> = {}): VueWrapper {
  return mount(CardDetails, { global: { stubs }, props: { cards: [], client, selectedCard: undefined, ...props } });
}

describe('components/CardDetails', () => {
  it('shows the saved card and offers the others', () => {
    const first = card('tok-1', '1111');
    const wrapper = mountDetails({ cards: [first, card('tok-2', '2222')], selectedCard: first });

    expect(wrapper.get('h2').text()).toBe('Card details');
    expect(wrapper.get('[data-cy="saved-card"]').text()).toBe('1111');
    expect(wrapper.get('[data-cy="use-other-card"]').text()).toBe('Use another card (1 saved)');
    expect(wrapper.find('[data-cy="new-card-form"]').exists()).toBe(false);
  });

  it('asks for a new card when none is saved, once the Braintree client is there', () => {
    expect(mountDetails().find('[data-cy="new-card-form"]').exists()).toBe(true);
    expect(mountDetails({ client: undefined }).find('[data-cy="new-card-form"]').exists()).toBe(false);
  });

  it('holds the card fields\' place while the saved cards load, so the form does not flash first', () => {
    const wrapper = mount(CardDetails, { global: { stubs }, props: { client, selectedCard: undefined } });

    expect(wrapper.find('[data-cy="card-details-loading"]').exists()).toBe(true);
    expect(wrapper.find('[data-cy="new-card-form"]').exists()).toBe(false);
    expect(wrapper.find('[data-cy="saved-card"]').exists()).toBe(false);
  });

  it('says that Braintree, not rotki, handles the card number', () => {
    expect(mountDetails().text()).toContain('rotki never sees or stores your card number');
  });

  it('passes the new card form\'s validity and tokenizing on', async () => {
    const wrapper = mount(CardDetails, { global: { stubs }, props: { cards: [], client, selectedCard: undefined } });

    wrapper.getComponent(HostedCardForm).vm.$emit('validation-change', true);
    expect(wrapper.emitted('validation-change')).toEqual([[true]]);

    await expect(wrapper.vm.tokenize()).resolves.toEqual({ bin: '411111', nonce: 'nonce-1' });
  });
});
