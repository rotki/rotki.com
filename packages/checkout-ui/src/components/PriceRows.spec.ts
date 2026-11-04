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

function row(wrapper: VueWrapper, id: string): { label: string; value: string } | undefined {
  const label = wrapper.find(`[data-cy="price-row-${id}"]`);
  if (!label.exists())
    return undefined;
  const value = label.element.nextElementSibling?.textContent ?? '';
  return { label: label.text(), value: value.trim() };
}

describe('priceRows', () => {
  it('starts from the price and shows the VAT it includes', () => {
    const wrapper = mountRows();

    expect(row(wrapper, 'subtotal')).toEqual({ label: 'Subtotal', value: '25.00 €' });
    expect(row(wrapper, 'vat')).toEqual({ label: 'VAT (19%, included)', value: '3.99 €' });
    expect(wrapper.find('[data-cy="grand-total"]').text()).toBe('25.00 €');
    expect(row(wrapper, 'discount')).toBeUndefined();
  });

  it('takes a referral off the subtotal', () => {
    const wrapper = mountRows({ breakdown: referral });

    expect(row(wrapper, 'subtotal')?.value).toBe('25.00 €');
    expect(row(wrapper, 'discount')).toEqual({ label: 'Referral discount (10%)', value: '−2.50 €' });
    expect(row(wrapper, 'vat')?.value).toBe('3.59 €');
    expect(wrapper.find('[data-cy="grand-total"]').text()).toBe('22.50 €');
  });

  it('shows no VAT row when no VAT applies', () => {
    const wrapper = mountRows({ breakdown: { ...referral, vatAmount: '0', vatRate: '0' } });

    expect(row(wrapper, 'vat')).toBeUndefined();
    expect(wrapper.find('[data-cy="grand-total"]').text()).toBe('22.50 €');
  });

  it('shows the plan price and holds the VAT row\'s place before the breakdown loads', () => {
    const wrapper = mountRows({ breakdown: undefined });

    expect(row(wrapper, 'subtotal')?.value).toBe('25.00 €');
    expect(row(wrapper, 'vat')).toEqual({ label: '', value: '' });
    expect(wrapper.findAllComponents({ name: 'RuiSkeletonLoader' }).length).toBeGreaterThan(0);
  });

  it('drops the held VAT row when no VAT applies', () => {
    const wrapper = mountRows({ breakdown: { ...breakdown, vatRate: '0', vatAmount: '0.00' } });

    expect(row(wrapper, 'vat')).toBeUndefined();
  });

  it('shows account credit as a deduction', () => {
    const wrapper = mountRows({
      breakdown: { ...breakdown, credit: { availableAmount: '20.00', creditedAmount: '10' }, finalAmount: '15.00' },
    });

    expect(row(wrapper, 'credit')).toEqual({ label: 'Credit applied', value: '−10.00 €' });
  });

  it('labels an upgrade as prorated and explains the proration', () => {
    const wrapper = mountRows({ upgrade: true });

    expect(row(wrapper, 'subtotal')?.label).toBe('Prorated upgrade');
    expect(wrapper.text()).toContain('price difference between the plans');
  });

  it('shows placeholders instead of amounts while loading', () => {
    const wrapper = mountRows({ breakdown: referral, loading: true });

    expect(wrapper.find('[data-cy="grand-total"]').exists()).toBe(false);
    expect(row(wrapper, 'discount')?.value).toBe('');
  });

  it('says when and what the next payment is', () => {
    const monthly = mountRows({ renewsAt: new Date(2026, 10, 2) });
    expect(monthly.find('[data-cy="next-payment"]').text()).toBe('Then 25.00 € per month from November 2, 2026. Cancel any time from your account.');

    const yearly = mountRows({ durationInMonths: 12 });
    expect(yearly.find('[data-cy="next-payment"]').text()).toBe('Then 25.00 € per year. Cancel any time from your account.');
  });

  it('explains one-time payments instead of a renewal', () => {
    const wrapper = mountRows({ oneTime: true, renewsAt: new Date(2026, 10, 2) });

    expect(wrapper.find('[data-cy="next-payment"]').text()).toBe('Crypto payments do not renew. We e-mail you before November 2, 2026 so you can pay for the next period.');
  });
});
