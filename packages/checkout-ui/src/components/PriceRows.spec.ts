import type { PaymentBreakdownResponse } from '@rotki/card-payment-common/schemas/plans';
import { DiscountType } from '@rotki/card-payment-common/schemas/discount';
import { mount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { installCheckoutMessages } from '../composables/checkout-messages';
import { checkoutMessages } from '../messages/en';
import { createTranslator } from '../utils/translator';
import PriceRows from './PriceRows.vue';

const plan = { price: 25 };

const breakdown: PaymentBreakdownResponse = {
  discount: null,
  finalAmount: '25.00',
  fullAmount: '25.00',
  nextPayment: 0,
  renewingPrice: '25.00',
  vatAmount: '3.99',
  vatRate: '0.1900',
};

const referral: PaymentBreakdownResponse = {
  ...breakdown,
  discount: {
    discountAmount: '10',
    discountType: DiscountType.PERCENTAGE,
    discountedAmount: '2.50',
    isReferral: true,
    isValid: true,
  },
  finalAmount: '22.50',
  vatAmount: '3.59',
};

type Props = InstanceType<typeof PriceRows>['$props'];

function mountRows(props: Partial<Props> = {}): VueWrapper {
  return mount(PriceRows, {
    global: {
      plugins: [{ install: app => installCheckoutMessages(app, createTranslator(checkoutMessages)) }],
    },
    props: { breakdown, durationInMonths: 1, plan, ...props },
  });
}

function row(wrapper: VueWrapper, label: string): string {
  const match = wrapper.findAll('div.flex').find(element => element.text().startsWith(label));
  return match?.text().slice(label.length).trim() ?? '';
}

describe('priceRows', () => {
  it('splits the total into subtotal and VAT', () => {
    const wrapper = mountRows();

    expect(row(wrapper, 'Subtotal:')).toBe('21.01 €');
    expect(row(wrapper, 'VAT (19%):')).toBe('3.99 €');
    expect(wrapper.find('[data-cy="grand-total"]').text()).toBe('25.00 €');
    expect(wrapper.text()).not.toContain('Discount savings');
    expect(wrapper.text()).not.toContain('Original price');
  });

  it('shows the plan price without VAT before the breakdown loads', () => {
    const wrapper = mountRows({ breakdown: undefined });

    expect(row(wrapper, 'VAT (0%):')).toBe('0.00 €');
    expect(wrapper.find('[data-cy="grand-total"]').text()).toBe('25.00 €');
  });

  it('shows the original price and the saving for a referral', () => {
    const wrapper = mountRows({ breakdown: referral });

    expect(wrapper.find('.line-through').text()).toBe('25.00 €');
    expect(row(wrapper, 'Discount savings:')).toBe('-2.50 €');
    expect(row(wrapper, 'VAT (19%):')).toBe('3.59 €');
    expect(wrapper.find('[data-cy="grand-total"]').text()).toBe('22.50 €');
  });

  it('leaves the original price out when no VAT applies', () => {
    const wrapper = mountRows({ breakdown: { ...referral, vatAmount: '0', vatRate: '0' } });

    expect(wrapper.find('.line-through').exists()).toBe(false);
    expect(row(wrapper, 'Discount savings:')).toBe('-2.50 €');
  });

  it('shows account credit', () => {
    const wrapper = mountRows({
      breakdown: { ...breakdown, credit: { availableAmount: '20.00', creditedAmount: '10' }, finalAmount: '15.00' },
    });

    expect(row(wrapper, 'Credit applied:')).toBe('-10.00 €');
  });

  it('shows placeholders instead of amounts while loading', () => {
    const wrapper = mountRows({ breakdown: referral, loading: true });

    expect(wrapper.find('[data-cy="grand-total"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('€');
    expect(wrapper.text()).toContain('Discount savings:');
  });

  it('shows the renewal date and the monthly or yearly charge', () => {
    const monthly = mountRows({ renewsAt: new Date(2026, 10, 2) });
    expect(monthly.text()).toContain('Renews on: November 2, 2026');
    expect(monthly.text()).toContain('charged automatically each month');

    const yearly = mountRows({ durationInMonths: 12 });
    expect(yearly.text()).toContain('charged automatically each year');
    expect(yearly.text()).not.toContain('Renews on');
  });

  it('explains one-time payments instead of a renewal', () => {
    const wrapper = mountRows({ oneTime: true, renewsAt: new Date(2026, 10, 2) });

    expect(wrapper.text()).toContain('Crypto payments are non-recurring');
    expect(wrapper.text()).not.toContain('Renews on');
    expect(wrapper.text()).not.toContain('charged automatically');
  });
});
