import type { PaymentBreakdownDiscount } from '../schemas/plans';
import { describe, expect, it } from 'vitest';
import { getValidDiscountCode } from './checkout';

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
