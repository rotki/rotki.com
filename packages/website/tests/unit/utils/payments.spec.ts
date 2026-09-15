import { describe, expect, it } from 'vitest';
import { hasCardPaymentInHistory } from '~/utils/payments';

describe('utils/payments.ts - hasCardPaymentInHistory', () => {
  it('detects a card payment by the backend PaidVia name', () => {
    expect(hasCardPaymentInHistory([{ isRefund: false, paidUsing: 'CREDIT_CARD' }])).toBe(true);
  });

  it('finds a card payment among other methods', () => {
    expect(hasCardPaymentInHistory([
      { isRefund: false, paidUsing: 'CRYPTO' },
      { isRefund: false, paidUsing: 'CREDIT_CARD' },
    ])).toBe(true);
  });

  it('ignores refunded card payments', () => {
    expect(hasCardPaymentInHistory([{ isRefund: true, paidUsing: 'CREDIT_CARD' }])).toBe(false);
  });

  it('returns false without card payments', () => {
    expect(hasCardPaymentInHistory([
      { isRefund: false, paidUsing: 'PAYPAL' },
      { isRefund: false, paidUsing: 'CRYPTO' },
      { isRefund: false, paidUsing: 'BANK_TRANSFER' },
    ])).toBe(false);
  });

  it('does not match the lowercase checkout method name', () => {
    expect(hasCardPaymentInHistory([{ isRefund: false, paidUsing: 'card' }])).toBe(false);
  });

  it('returns false for an empty history', () => {
    expect(hasCardPaymentInHistory([])).toBe(false);
  });
});
