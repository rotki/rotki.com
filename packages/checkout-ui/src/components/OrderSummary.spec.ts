import type { PaymentBreakdownResponse } from '@rotki/card-payment-common/schemas/plans';
import { DiscountType } from '@rotki/card-payment-common/schemas/discount';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import OrderSummary from './OrderSummary.vue';

type Props = InstanceType<typeof OrderSummary>['$props'];

const plan = { durationInMonths: 1, name: 'basic', price: 25 };

const referral: PaymentBreakdownResponse = {
  discount: {
    discountAmount: '10',
    discountType: DiscountType.PERCENTAGE,
    discountedAmount: '2.50',
    isReferral: true,
    isValid: true,
  },
  finalAmount: '22.50',
  fullAmount: '25.00',
  nextPayment: 0,
  renewingPrice: '25.00',
  vatAmount: '3.59',
  vatRate: '0.1900',
};

function mountSummary(props: Partial<Props> = {}, slots: Record<string, () => unknown> = {}): VueWrapper {
  return mount(OrderSummary, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { code: '', plan, ...props },
    slots,
  });
}

describe('orderSummary', () => {
  it('shows the plan, the discount entry and the price rows under one heading', () => {
    const wrapper = mountSummary();

    expect(wrapper.get('h2').text()).toBe('Order summary');
    // The payment page's summary bar shows the same title below lg.
    expect(wrapper.get('h2').classes()).toContain('max-lg:sr-only');
    expect(wrapper.get('[data-testid="plan-name"]').text()).toBe('Basic, monthly');
    expect(wrapper.find('[data-testid="discount-open"]').exists()).toBe(true);
    expect(wrapper.get('[data-testid="grand-total"]').text()).toBe('25.00 €');
  });

  it('shows an applied referral from the breakdown and its effect on the total', () => {
    const wrapper = mountSummary({ breakdown: referral, code: 'DGXXOU' });

    expect(wrapper.get('[data-testid="applied-code"]').text()).toBe('DGXXOU');
    expect(wrapper.get('[data-testid="grand-total"]').text()).toBe('22.50 €');
  });

  it('passes a removed code on', async () => {
    const wrapper = mountSummary({ breakdown: referral, code: 'DGXXOU' });

    await wrapper.get('button[aria-label="Remove discount code"]').trigger('click');

    expect(wrapper.emitted('apply')).toEqual([['']]);
    expect(wrapper.emitted('update:code')).toEqual([['']]);
  });

  it('places the page\'s plan action and notice', () => {
    const wrapper = mountSummary({}, {
      'notice': () => h('p', { 'data-testid': 'notice' }, 'No reverse charge'),
      'plan-action': () => h('button', 'Change'),
    });

    expect(wrapper.get('button').text()).toBe('Change');
    expect(wrapper.find('[data-testid="notice"]').exists()).toBe(true);
  });

  it('describes a one-time crypto payment', () => {
    const wrapper = mountSummary({ oneTime: true, renewsAt: new Date(2026, 11, 3) });

    expect(wrapper.get('[data-testid="plan-name"]').text()).toBe('Basic, 1 month');
    expect(wrapper.text()).toContain('Paid once, no renewal');
    expect(wrapper.get('[data-testid="next-payment"]').text()).toContain('Crypto payments do not renew');
  });
});
