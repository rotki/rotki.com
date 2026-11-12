import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import PaymentPage from './PaymentPage.vue';

type Props = InstanceType<typeof PaymentPage>['$props'];

function mountPage(props: Partial<Props> = {}, slots: Record<string, () => unknown> = {}): VueWrapper {
  return mount(PaymentPage, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props,
    slots: {
      default: () => h('div', { 'data-testid': 'panel' }, 'Card fields'),
      summary: () => h('div', { 'data-testid': 'summary' }, 'Order summary'),
      ...slots,
    },
  });
}

describe('paymentPage', () => {
  it('asks how to pay unless the page names its own heading', () => {
    expect(mountPage().get('h1').text()).toBe('How would you like to pay?');
    expect(mountPage({ title: 'Payment sent' }).get('h1').text()).toBe('Payment sent');
  });

  it('places the method tiles and the panel in the main column', () => {
    const wrapper = mountPage({}, { methods: () => h('nav', 'Tiles') });

    const main = wrapper.get('[data-testid="payment-page-main"]');
    expect(main.text()).toContain('Tiles');
    expect(main.find('[data-testid="panel"]').exists()).toBe(true);
  });

  it('spans the heading over both columns, so the main column and the summary start level', () => {
    const wrapper = mountPage({}, { pay: () => h('button', 'Pay') });

    const heading = wrapper.get('[data-testid="payment-page-heading"]');
    expect(heading.find('h1').exists()).toBe(true);
    expect(heading.classes()).toContain('lg:col-span-2');
    expect(wrapper.get('[data-testid="payment-page-main"]').classes()).toContain('lg:row-start-2');
    expect(wrapper.get('aside').element.parentElement?.classList).toContain('lg:row-start-2');
    expect(wrapper.get('[data-testid="payment-page-pay"]').element.parentElement).toBe(wrapper.get('aside').element.parentElement);
  });

  it('renders the summary and the pay action once each', () => {
    const wrapper = mountPage({}, { pay: () => h('button', { 'data-testid': 'pay' }, 'Subscribe and pay') });

    expect(wrapper.findAll('[data-testid="summary"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="pay"]')).toHaveLength(1);
    expect(wrapper.find('[data-testid="payment-page-pay"] [data-testid="pay"]').exists()).toBe(true);
  });

  it('shows a page alert under the heading, above both columns', () => {
    const wrapper = mountPage({}, { alert: () => h('div', { 'data-testid': 'page-alert' }, 'Payment failed') });

    expect(wrapper.find('[data-testid="payment-page-heading"] [data-testid="page-alert"]').exists()).toBe(true);
  });

  it('leaves out the pay bar when the page has no pay action', () => {
    expect(mountPage().find('[data-testid="payment-page-pay"]').exists()).toBe(false);
  });

  it('draws the summary and the pay bar edge to edge only on phones, as cards from md', () => {
    const wrapper = mountPage({}, { pay: () => h('button', 'Pay') });

    const aside = wrapper.get('aside').classes();
    expect(aside).toEqual(expect.arrayContaining(['-mx-4', 'md:m-0', 'md:border', 'md:rounded-rui-card']));
    const pay = wrapper.get('[data-testid="payment-page-pay"]').classes();
    expect(pay).toEqual(expect.arrayContaining(['-mx-4', 'md:mx-0', 'md:rounded-t-rui-card', 'lg:rounded-none']));
  });

  it('folds the summary on phones into a bar with the total, and unfolds it on request', async () => {
    const wrapper = mountPage({ total: '22.50 €', totalNote: 'then 25.00 €/month' });
    const toggle = wrapper.get('[data-testid="summary-toggle"]');

    expect(toggle.text()).toContain('Order summary');
    expect(toggle.text()).toContain('22.50 €');
    expect(toggle.text()).toContain('then 25.00 €/month');
    expect(toggle.attributes('aria-expanded')).toBe('false');
    expect(wrapper.get('[data-testid="payment-page-summary"]').classes()).toContain('hidden');

    await toggle.trigger('click');

    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('[data-testid="payment-page-summary"]').classes()).not.toContain('hidden');
  });
});
