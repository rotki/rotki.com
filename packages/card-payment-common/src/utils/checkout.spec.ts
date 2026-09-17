import type { PaymentBreakdownDiscount } from '../schemas/plans';
import { describe, expect, it } from 'vitest';
import { getValidDiscountCode, resolveDiscountCode } from './checkout';

describe('resolveDiscountCode', () => {
  it('should prefer the explicit code over referral and campaign', () => {
    expect(resolveDiscountCode({ explicit: 'MINE', referral: 'REF', campaign: 'SUMMER' })).toBe('MINE');
  });

  it('should keep the explicit code even after a dismissal', () => {
    expect(resolveDiscountCode({ explicit: 'MINE', dismissed: true, campaign: 'SUMMER' })).toBe('MINE');
  });

  it('should prefer the referral code over the campaign code', () => {
    expect(resolveDiscountCode({ referral: 'REF', campaign: 'SUMMER' })).toBe('REF');
  });

  it('should fall back to the campaign code', () => {
    expect(resolveDiscountCode({ campaign: 'SUMMER' })).toBe('SUMMER');
  });

  it('should skip empty explicit and referral codes', () => {
    expect(resolveDiscountCode({ explicit: '', referral: '', campaign: 'SUMMER' })).toBe('SUMMER');
  });

  it('should apply nothing automatically once dismissed', () => {
    expect(resolveDiscountCode({ dismissed: true, referral: 'REF', campaign: 'SUMMER' })).toBeUndefined();
  });

  it('should return undefined without any source', () => {
    expect(resolveDiscountCode({})).toBeUndefined();
  });
});

describe('getValidDiscountCode', () => {
  const validDiscount: PaymentBreakdownDiscount = {
    isValid: true,
    isReferral: false,
    discountType: 'percentage',
    discountAmount: '20',
    discountedAmount: '80.00',
  };

  const invalidDiscount: PaymentBreakdownDiscount = {
    isValid: false,
    error: 'limit reached',
  };

  it('should return the code when discount is valid', () => {
    expect(getValidDiscountCode(validDiscount, 'SAVE20')).toBe('SAVE20');
  });

  it('should return undefined when discount is invalid', () => {
    expect(getValidDiscountCode(invalidDiscount, 'EXPIRED')).toBeUndefined();
  });

  it('should return undefined when discount is null', () => {
    expect(getValidDiscountCode(null, 'CODE')).toBeUndefined();
  });

  it('should return undefined when discount is undefined', () => {
    expect(getValidDiscountCode(undefined, 'CODE')).toBeUndefined();
  });

  it('should return undefined when code is undefined', () => {
    expect(getValidDiscountCode(validDiscount, undefined)).toBeUndefined();
  });

  it('should return undefined when code is empty string', () => {
    expect(getValidDiscountCode(validDiscount, '')).toBeUndefined();
  });

  it('should return undefined when both are undefined', () => {
    expect(getValidDiscountCode(undefined, undefined)).toBeUndefined();
  });

  it('should return the code for valid referral discount', () => {
    const referralDiscount: PaymentBreakdownDiscount = {
      isValid: true,
      isReferral: true,
      discountType: 'referral',
      discountAmount: '10',
      discountedAmount: '90.00',
    };
    expect(getValidDiscountCode(referralDiscount, 'REF123')).toBe('REF123');
  });
});
