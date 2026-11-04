import { afterEach, describe, expect, it } from 'vitest';
import { PAYMENT_COMPLETED_KEY } from '~/modules/checkout/constants';
import { buildPaymentReceipt, storePaymentReceipt, takePaymentReceipt } from '~/modules/checkout/utils/payment-receipt';

describe('payment receipt', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  it('builds the receipt from the plan and its breakdown', () => {
    expect(buildPaymentReceipt('paypal', { name: 'basic', durationInMonths: 12 }, { finalAmount: '225.00', renewingPrice: '250.00' }, false)).toEqual({
      method: 'paypal',
      planName: 'basic',
      durationInMonths: 12,
      paid: '225.00',
      renewingPrice: '250.00',
      upgrade: false,
    });
  });

  it('can be taken once', () => {
    const receipt = buildPaymentReceipt('crypto', { name: 'basic', durationInMonths: 1 }, undefined, true);
    storePaymentReceipt(receipt);

    expect(takePaymentReceipt()).toEqual(receipt);
    expect(takePaymentReceipt()).toBeUndefined();
    expect(sessionStorage.getItem(PAYMENT_COMPLETED_KEY)).toBeNull();
  });

  it.each([
    ['the old flag', 'true'],
    ['broken JSON', '{'],
    ['an unknown method', JSON.stringify({ method: 'cash', durationInMonths: 1, upgrade: false })],
  ])('rejects %s', (_, stored) => {
    sessionStorage.setItem(PAYMENT_COMPLETED_KEY, stored);

    expect(takePaymentReceipt()).toBeUndefined();
    expect(sessionStorage.getItem(PAYMENT_COMPLETED_KEY)).toBeNull();
  });
});
