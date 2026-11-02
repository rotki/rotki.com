import type { ComposerTranslation } from 'vue-i18n';
import { mountSuspended } from '@nuxt/test-utils/runtime';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { hasCardPaymentInHistory, invoiceUrl, latestPayment, paymentMethodLabel } from '~/utils/payments';

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

describe('utils/payments.ts - paymentMethodLabel', () => {
  let t: ComposerTranslation;

  /** The labels come from the messages, so take `t` from a mounted component. */
  beforeAll(async () => {
    await mountSuspended(defineComponent({
      setup() {
        t = useI18n({ useScope: 'global' }).t;
        return () => h('div');
      },
    }));
  });

  it.each([
    ['CREDIT_CARD', 'Card'],
    ['PAYPAL', 'PayPal'],
    ['CRYPTO', 'Crypto'],
    ['BANK_TRANSFER', 'Bank transfer'],
  ])('names %s', (paidUsing, label) => {
    expect(paymentMethodLabel(t, { paidUsing, referralCreditAppliedEur: 0 })).toBe(label);
  });

  it('makes a method it does not know readable', () => {
    expect(paymentMethodLabel(t, { paidUsing: 'GIFT_CARD', referralCreditAppliedEur: 0 })).toBe('Gift Card');
  });

  it('adds the credit when some was applied', () => {
    expect(paymentMethodLabel(t, { paidUsing: 'PAYPAL', referralCreditAppliedEur: 5 })).toBe('PayPal + Credit');
  });
});

describe('utils/payments.ts - invoiceUrl', () => {
  it('links a payment to its invoice', () => {
    expect(invoiceUrl({ identifier: 'abc', legacy: false })).toBe('/webapi/2/invoices/abc/');
  });

  it('links a legacy payment to its receipt', () => {
    expect(invoiceUrl({ identifier: 'abc', legacy: true })).toBe('/webapi/download/receipt/abc/');
  });
});

describe('utils/payments.ts - latestPayment', () => {
  const january = { isRefund: false, paidAt: '2026-01-10T10:00:00Z' };
  const march = { isRefund: false, paidAt: '2026-03-10T10:00:00Z' };
  const aprilRefund = { isRefund: true, paidAt: '2026-04-01T10:00:00Z' };

  it('picks the newest payment whatever the order', () => {
    expect(latestPayment([march, january])).toBe(march);
    expect(latestPayment([january, march])).toBe(march);
  });

  it('skips refunds, even newer ones', () => {
    expect(latestPayment([january, aprilRefund, march])).toBe(march);
  });

  it('has nothing when every payment was refunded', () => {
    expect(latestPayment([aprilRefund])).toBeUndefined();
    expect(latestPayment([])).toBeUndefined();
  });
});
