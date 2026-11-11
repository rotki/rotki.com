import type { PaymentReceipt } from '~/modules/checkout/utils/payment-receipt';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { type DOMWrapper, flushPromises, type VueWrapper } from '@vue/test-utils';
import { set } from '@vueuse/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SuccessPage from '~/pages/checkout/success.vue';

vi.mock('~/composables/account/use-auto-logout', () => ({
  useAutoLogout: vi.fn(),
}));

const CARD: PaymentReceipt = {
  method: 'card',
  planName: 'basic',
  durationInMonths: 1,
  paid: '22.50',
  renewingPrice: '25.00',
  upgrade: false,
};

async function mountWith(receipt: PaymentReceipt | undefined): Promise<VueWrapper> {
  set(useState<PaymentReceipt | undefined>('payment-receipt'), receipt);
  const wrapper = await mountSuspended(SuccessPage);
  await flushPromises();
  return wrapper;
}

function row(wrapper: VueWrapper, id: string): DOMWrapper<Element> {
  return wrapper.find(`[data-testid="receipt-value"][data-key="${id}"]`);
}

describe('checkout success page', () => {
  afterEach(() => {
    set(useState<PaymentReceipt | undefined>('payment-receipt'), undefined);
  });

  it('names the plan, what was paid and the next payment', async () => {
    const wrapper = await mountWith(CARD);

    expect(wrapper.get('h1').text()).toBe('You\'re on Basic');
    expect(wrapper.get('[data-testid="payment-success-message"]').text()).toBe('Your payment of 22.50 € went through.');
    expect(row(wrapper, 'plan').text()).toBe('Basic, monthly');
    expect(row(wrapper, 'paid').text()).toBe('22.50 €');
    expect(row(wrapper, 'next-payment').text()).toMatch(/^25\.00 € on \w+ \d{1,2}, \d{4}$/);
    expect(row(wrapper, 'method').text()).toBe('Card');
  });

  it('leads to the API credentials, the setup guide and the account', async () => {
    const wrapper = await mountWith(CARD);

    const next = wrapper.get('[data-testid="payment-success-next"]');
    expect(next.get('a[href="/home/devices"]').text()).toBe('Create API credentials');
    expect(next.get('a[href^="https://docs.rotki.com"]').text()).toBe('Read the setup guide');
    expect(wrapper.get('a[href="/home/subscription"]').text()).toBe('Go to your account');
  });

  it('leaves the next payment out for an upgrade, which keeps its billing date', async () => {
    const wrapper = await mountWith({ ...CARD, method: 'paypal', upgrade: true });

    expect(row(wrapper, 'next-payment').exists()).toBe(false);
    expect(row(wrapper, 'method').text()).toBe('PayPal');
  });

  it('shows a crypto payment as pending, without a renewal', async () => {
    const wrapper = await mountWith({ ...CARD, method: 'crypto' });

    expect(wrapper.get('h1').text()).toBe('Your payment is on its way');
    expect(wrapper.text()).toContain('We e-mail you once the transaction is confirmed');
    expect(wrapper.text()).toContain('You can do this once Premium is active.');
    expect(row(wrapper, 'plan').text()).toBe('Basic, 1 month');
    expect(row(wrapper, 'next-payment').exists()).toBe(false);
    expect(row(wrapper, 'method').text()).toBe('Crypto');
  });

  it('calls a pending crypto payment an amount, not paid', async () => {
    const wrapper = await mountWith({ ...CARD, method: 'crypto' });

    expect(row(wrapper, 'paid').element.previousElementSibling?.textContent?.trim()).toBe('Amount');
  });

  it.each([
    ['an upgrade', { method: 'card', upgrade: true }],
    ['a crypto upgrade', { method: 'crypto', upgrade: true }],
    ['a crypto renewal', { method: 'crypto', renewal: true }],
  ] as const)('skips the first-time setup steps for %s', async (_, receipt) => {
    const wrapper = await mountWith({ ...CARD, ...receipt });

    expect(wrapper.find('[data-testid="payment-success-next"]').exists()).toBe(false);
    expect(wrapper.get('a[href="/home/subscription"]').text()).toBe('Go to your account');
  });

  it('does not promise an activation for a crypto renewal', async () => {
    const wrapper = await mountWith({ ...CARD, method: 'crypto', renewal: true });

    expect(wrapper.get('[data-testid="payment-success-message"]').text()).toContain('Your current subscription stays as it is');
  });

  it('falls back to a plain confirmation without a plan name', async () => {
    const wrapper = await mountWith({ ...CARD, planName: undefined, paid: undefined });

    expect(wrapper.get('h1').text()).toBe('Your payment went through');
    expect(wrapper.find('[data-testid="payment-success-message"]').exists()).toBe(false);
    expect(row(wrapper, 'plan').exists()).toBe(false);
  });
});
