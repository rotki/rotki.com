import type { PaymentBreakdownResponse } from '@rotki/card-payment-common/schemas/plans';
import { SigilEvents } from '@rotki/sigil';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { purchaseDiscount, useCompletePurchase } from '~/modules/checkout/composables/use-complete-purchase';
import { takePaymentReceipt } from '~/modules/checkout/utils/payment-receipt';

const { chronicle } = vi.hoisted(() => ({ chronicle: vi.fn() }));

vi.mock('~/composables/chronicling/use-sigil-events', () => ({
  useSigilEvents: () => ({ chronicle }),
}));

type BreakdownDiscount = PaymentBreakdownResponse['discount'];

const discount: BreakdownDiscount = { isValid: true, isReferral: false, discountType: 'percentage', discountAmount: '2.50', discountedAmount: '22.50' };
const referral: BreakdownDiscount = { isValid: true, isReferral: true, discountType: 'percentage', discountAmount: '2.50', discountedAmount: '22.50' };
const rejected: BreakdownDiscount = { isValid: false, error: 'Unknown code' };

describe('useCompletePurchase', () => {
  afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it('records the purchase and leaves its receipt for the success page', () => {
    const { completePurchase } = useCompletePurchase();

    completePurchase({
      method: 'paypal',
      plan: { planId: 3, name: 'basic', durationInMonths: 12 },
      paid: '225.00',
      renewingPrice: '250.00',
      upgrade: false,
      discount: 'referral',
    });

    expect(chronicle).toHaveBeenCalledExactlyOnceWith(SigilEvents.PURCHASE_SUCCESS, {
      paymentMethod: 'paypal',
      planId: 3,
      planName: 'basic',
      planDuration: 'yearly',
      revenue: 225,
      currency: 'EUR',
      isUpgrade: false,
      discount: 'referral',
    });
    expect(takePaymentReceipt()).toEqual({
      method: 'paypal',
      planName: 'basic',
      durationInMonths: 12,
      paid: '225.00',
      renewingPrice: '250.00',
      upgrade: false,
    });
  });

  it('leaves the revenue out when the amount is unknown', () => {
    useCompletePurchase().completePurchase({ method: 'crypto', plan: { planId: 3, durationInMonths: 1 }, upgrade: true });

    expect(chronicle).toHaveBeenCalledWith(SigilEvents.PURCHASE_SUCCESS, expect.objectContaining({ revenue: undefined, isUpgrade: true }));
  });

  it.each([
    ['a valid discount code', discount, 'discount'],
    ['a valid referral', referral, 'referral'],
    ['a rejected code', rejected, undefined],
    ['no code', null, undefined],
  ])('names %s', (_, value, expected) => {
    expect(purchaseDiscount(value)).toBe(expected);
  });
});
