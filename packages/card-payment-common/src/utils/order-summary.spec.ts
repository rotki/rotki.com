import type { PaymentBreakdownResponse } from '../schemas/plans';
import { describe, expect, it } from 'vitest';
import { DiscountType } from '../schemas/discount';
import { buildDiscountSummary, buildOrderSummary, vatRatePercent } from './order-summary';

const plan = { price: 25 };

function breakdownWith(overrides: Partial<PaymentBreakdownResponse> = {}): PaymentBreakdownResponse {
  return {
    fullAmount: '25.00',
    finalAmount: '25.00',
    vatRate: '0',
    vatAmount: '0.00',
    renewingPrice: '25.00',
    nextPayment: 0,
    discount: null,
    credit: null,
    ...overrides,
  };
}

describe('vatRatePercent', () => {
  it('should convert a fraction to percent', () => {
    expect(vatRatePercent('0.19')).toBe(19);
    expect(vatRatePercent('0.255')).toBe(25.5);
    expect(vatRatePercent(0.07)).toBe(7);
  });

  it('should keep a value that is already a percentage', () => {
    expect(vatRatePercent('19')).toBe(19);
    expect(vatRatePercent('21.00')).toBe(21);
    expect(vatRatePercent('1')).toBe(1);
  });

  it('should return 0 when no VAT applies', () => {
    expect(vatRatePercent('0')).toBe(0);
    expect(vatRatePercent('-1')).toBe(0);
    expect(vatRatePercent('')).toBe(0);
    expect(vatRatePercent('abc')).toBe(0);
  });
});

describe('buildDiscountSummary', () => {
  it('should be undefined without a code or for a rejected code', () => {
    expect(buildDiscountSummary(undefined)).toBeUndefined();
    expect(buildDiscountSummary(null)).toBeUndefined();
    expect(buildDiscountSummary({ error: 'Code expired', isValid: false })).toBeUndefined();
  });

  it('should give the saving and the percentage of a percentage code', () => {
    expect(buildDiscountSummary({
      discountAmount: '10.00',
      discountType: DiscountType.PERCENTAGE,
      discountedAmount: '2.5',
      isReferral: true,
      isValid: true,
    })).toEqual({ isReferral: true, percent: '10%', saved: { amount: 2.5, formatted: '2.50 €' } });
  });

  it('should leave the percentage out for a fixed amount code', () => {
    expect(buildDiscountSummary({
      discountAmount: '5.00',
      discountType: DiscountType.FIXED,
      discountedAmount: '5',
      isReferral: false,
      isValid: true,
    })).toEqual({ isReferral: false, percent: undefined, saved: { amount: 5, formatted: '5.00 €' } });
  });
});

describe('buildOrderSummary', () => {
  it('should fall back to the plan price without a breakdown', () => {
    const summary = buildOrderSummary({ plan });

    expect(summary.price.formatted).toBe('25.00 €');
    expect(summary.proratedPrice).toBeUndefined();
    expect(summary.fullAmount.formatted).toBe('25.00 €');
    expect(summary.discount).toBeUndefined();
    expect(summary.credit).toBeUndefined();
    expect(summary.subtotal.formatted).toBe('25.00 €');
    expect(summary.vat).toEqual({ rate: 0, formattedRate: '0%', amount: { amount: 0, formatted: '0.00 €' } });
    expect(summary.dueToday).toEqual({ amount: 25, formatted: '25.00 €' });
    expect(summary.renewal).toEqual({ amount: 25, formatted: '25.00 €' });
  });

  it('should summarise a plain plan with 0% VAT', () => {
    const summary = buildOrderSummary({ plan, breakdown: breakdownWith() });

    expect(summary.price.formatted).toBe('25.00 €');
    expect(summary.subtotal.formatted).toBe('25.00 €');
    expect(summary.vat.rate).toBe(0);
    expect(summary.vat.formattedRate).toBe('0%');
    expect(summary.vat.amount.formatted).toBe('0.00 €');
    expect(summary.dueToday.formatted).toBe('25.00 €');
  });

  it('should ignore the VAT amount when the rate is 0', () => {
    const summary = buildOrderSummary({ plan, breakdown: breakdownWith({ vatAmount: '3.99' }) });

    expect(summary.vat.amount.amount).toBe(0);
    expect(summary.subtotal.amount).toBe(25);
  });

  it('should split 19% VAT out of the total in cents', () => {
    const summary = buildOrderSummary({
      plan,
      breakdown: breakdownWith({ fullAmount: '29.75', finalAmount: '29.75', vatRate: '0.19', vatAmount: '4.75', renewingPrice: '29.75' }),
    });

    expect(summary.price.formatted).toBe('29.75 €');
    expect(summary.subtotal).toEqual({ amount: 25, formatted: '25.00 €' });
    expect(summary.vat).toEqual({ rate: 19, formattedRate: '19%', amount: { amount: 4.75, formatted: '4.75 €' } });
    expect(summary.dueToday.formatted).toBe('29.75 €');
    expect(summary.renewal.formatted).toBe('29.75 €');
  });

  it('should subtract in cents, so 0.30 - 0.10 is 0.2 and not 0.19999999999999998', () => {
    const summary = buildOrderSummary({
      plan,
      breakdown: breakdownWith({ finalAmount: '0.30', vatRate: '19', vatAmount: '0.10' }),
    });

    expect(summary.subtotal.amount).toBe(0.2);
  });

  it('should add the referral discount line', () => {
    const summary = buildOrderSummary({
      plan,
      breakdown: breakdownWith({
        finalAmount: '22.50',
        renewingPrice: '25.00',
        discount: { isValid: true, isReferral: true, discountType: 'Percentage', discountAmount: '10.00', discountedAmount: '2.50' },
      }),
    });

    expect(summary.fullAmount.formatted).toBe('25.00 €');
    expect(summary.discount).toEqual({
      saved: { amount: 2.5, formatted: '2.50 €' },
      isReferral: true,
      percent: '10%',
    });
    expect(summary.dueToday.formatted).toBe('22.50 €');
    expect(summary.renewal.formatted).toBe('25.00 €');
  });

  it('should add a fixed discount code without a percentage', () => {
    const summary = buildOrderSummary({
      plan,
      breakdown: breakdownWith({
        finalAmount: '20.00',
        discount: { isValid: true, isReferral: false, discountType: 'Fixed Amount', discountAmount: '5', discountedAmount: '5' },
      }),
    });

    expect(summary.discount).toEqual({
      saved: { amount: 5, formatted: '5.00 €' },
      isReferral: false,
      percent: undefined,
    });
  });

  it('should skip an invalid discount', () => {
    const summary = buildOrderSummary({
      plan,
      breakdown: breakdownWith({ discount: { isValid: false, error: 'Code expired' } }),
    });

    expect(summary.discount).toBeUndefined();
  });

  it('should add the account credit line', () => {
    const summary = buildOrderSummary({
      plan,
      breakdown: breakdownWith({ finalAmount: '15.00', credit: { availableAmount: '30.00', creditedAmount: '10' } }),
    });

    expect(summary.credit).toEqual({ amount: 10, formatted: '10.00 €' });
    expect(summary.dueToday.formatted).toBe('15.00 €');
  });

  it('should skip credit that does not lower the charge', () => {
    expect(buildOrderSummary({
      plan,
      breakdown: breakdownWith({ credit: { availableAmount: '0', creditedAmount: '0.00' } }),
    }).credit).toBeUndefined();
    expect(buildOrderSummary({
      plan,
      breakdown: breakdownWith({ credit: { availableAmount: '0', creditedAmount: 'abc' } }),
    }).credit).toBeUndefined();
  });

  it('should show the plan price and the prorated charge for an upgrade', () => {
    const summary = buildOrderSummary({
      plan: { price: 45 },
      upgrade: true,
      breakdown: breakdownWith({
        fullAmount: '12.34',
        finalAmount: '12.34',
        vatRate: '0.19',
        vatAmount: '1.97',
        renewingPrice: '53.55',
        nextPayment: 1767225600,
      }),
    });

    expect(summary.price.formatted).toBe('45.00 €');
    expect(summary.proratedPrice?.formatted).toBe('12.34 €');
    expect(summary.subtotal.formatted).toBe('10.37 €');
    expect(summary.vat.amount.formatted).toBe('1.97 €');
    expect(summary.dueToday.formatted).toBe('12.34 €');
    expect(summary.renewal.formatted).toBe('53.55 €');
  });

  it('should not show a prorated charge for an upgrade without a breakdown', () => {
    const summary = buildOrderSummary({ plan: { price: 45 }, upgrade: true });

    expect(summary.price.formatted).toBe('45.00 €');
    expect(summary.proratedPrice).toBeUndefined();
  });

  it('should combine discount, credit and VAT', () => {
    const summary = buildOrderSummary({
      plan: { price: 250 },
      breakdown: breakdownWith({
        fullAmount: '297.50',
        finalAmount: '1234.50',
        vatRate: '19',
        vatAmount: '197.10',
        renewingPrice: '297.50',
        discount: { isValid: true, isReferral: false, discountType: 'Percentage', discountAmount: '12.50', discountedAmount: '37.19' },
        credit: { availableAmount: '20', creditedAmount: '20.00' },
      }),
    });

    expect(summary.discount?.percent).toBe('12.5%');
    expect(summary.credit?.formatted).toBe('20.00 €');
    expect(summary.subtotal.formatted).toBe('1,037.40 €');
    expect(summary.dueToday.formatted).toBe('1,234.50 €');
  });
});
