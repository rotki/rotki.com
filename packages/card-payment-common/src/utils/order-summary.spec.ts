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
  const referral = {
    discountAmount: '10',
    discountType: DiscountType.PERCENTAGE,
    discountedAmount: '2.50',
    isReferral: true,
    isValid: true,
  } as const;

  /** Subtotal minus discount and credit must give the amount due, so the rows add up. */
  function rowsAddUp(summary: ReturnType<typeof buildOrderSummary>): boolean {
    const deductions = (summary.discount?.saved.amount ?? 0) + (summary.credit?.amount ?? 0);
    return Math.round((summary.subtotal.amount - deductions) * 100) === Math.round(summary.dueToday.amount * 100);
  }

  it('should fall back to the plan price without a breakdown', () => {
    const summary = buildOrderSummary({ plan });

    expect(summary.subtotal.formatted).toBe('25.00 €');
    expect(summary.dueToday.formatted).toBe('25.00 €');
    expect(summary.renewal.formatted).toBe('25.00 €');
    expect(summary.vat).toBeUndefined();
    expect(summary.prorated).toBe(false);
  });

  it('should show the VAT a German consumer pays as included in the price', () => {
    const summary = buildOrderSummary({ plan, breakdown: breakdownWith({ vatRate: '0.1900', vatAmount: '3.99' }) });

    expect(summary.subtotal.formatted).toBe('25.00 €');
    expect(summary.vat).toEqual({ rate: 19, formattedRate: '19%', amount: { amount: 3.99, formatted: '3.99 €' } });
    expect(summary.dueToday.formatted).toBe('25.00 €');
    expect(rowsAddUp(summary)).toBe(true);
  });

  it('should take a referral off the full price for a German consumer', () => {
    const summary = buildOrderSummary({
      plan,
      breakdown: breakdownWith({ discount: referral, finalAmount: '22.50', vatRate: '0.1900', vatAmount: '3.59' }),
    });

    expect(summary.subtotal.formatted).toBe('25.00 €');
    expect(summary.discount).toEqual({ saved: { amount: 2.5, formatted: '2.50 €' }, isReferral: true, percent: '10%' });
    expect(summary.vat?.amount.formatted).toBe('3.59 €');
    expect(summary.dueToday.formatted).toBe('22.50 €');
    expect(rowsAddUp(summary)).toBe(true);
  });

  it('should leave VAT out for a customer whose country has none, such as the US', () => {
    const summary = buildOrderSummary({ plan, breakdown: breakdownWith({ discount: referral, finalAmount: '22.50' }) });

    expect(summary.vat).toBeUndefined();
    expect(summary.dueToday.formatted).toBe('22.50 €');
    expect(rowsAddUp(summary)).toBe(true);
  });

  it('should ignore a VAT amount sent with a zero rate', () => {
    const summary = buildOrderSummary({ plan, breakdown: breakdownWith({ vatAmount: '4.00' }) });

    expect(summary.vat).toBeUndefined();
  });

  it('should start from the price without VAT for an EU business with a valid VAT ID (France, 20%, removed before the discount)', () => {
    const summary = buildOrderSummary({
      plan,
      breakdown: breakdownWith({
        discount: { ...referral, discountedAmount: '2.08' },
        finalAmount: '18.75',
        fullAmount: '20.83',
        renewingPrice: '20.83',
      }),
    });

    expect(summary.subtotal.formatted).toBe('20.83 €');
    expect(summary.vat).toBeUndefined();
    expect(summary.dueToday.formatted).toBe('18.75 €');
    expect(summary.renewal.formatted).toBe('20.83 €');
    expect(rowsAddUp(summary)).toBe(true);
  });

  it('should start an upgrade from the prorated charge and take the credit off', () => {
    const summary = buildOrderSummary({
      plan: { price: 50 },
      upgrade: true,
      breakdown: breakdownWith({
        credit: { availableAmount: '20.00', creditedAmount: '5.00' },
        finalAmount: '7.50',
        fullAmount: '12.50',
        renewingPrice: '50.00',
        vatRate: '0.1900',
        vatAmount: '1.20',
      }),
    });

    expect(summary.prorated).toBe(true);
    expect(summary.subtotal.formatted).toBe('12.50 €');
    expect(summary.credit?.formatted).toBe('5.00 €');
    expect(summary.vat?.amount.formatted).toBe('1.20 €');
    expect(summary.dueToday.formatted).toBe('7.50 €');
    expect(summary.renewal.formatted).toBe('50.00 €');
    expect(rowsAddUp(summary)).toBe(true);
  });

  it('should skip an invalid discount', () => {
    const summary = buildOrderSummary({ plan, breakdown: breakdownWith({ discount: { isValid: false, error: 'Expired' } }) });

    expect(summary.discount).toBeUndefined();
  });

  it('should skip credit that does not lower the charge', () => {
    const summary = buildOrderSummary({ plan, breakdown: breakdownWith({ credit: { availableAmount: '0.00', creditedAmount: '0.00' } }) });

    expect(summary.credit).toBeUndefined();
  });

  it('should keep amounts in cents, so 0.30 - 0.10 shows as 0.20', () => {
    const summary = buildOrderSummary({
      plan: { price: 0.3 },
      breakdown: breakdownWith({ credit: { availableAmount: '1.00', creditedAmount: '0.10' }, finalAmount: '0.20', fullAmount: '0.30' }),
    });

    expect(summary.dueToday.amount).toBe(0.2);
    expect(rowsAddUp(summary)).toBe(true);
  });
});
