import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { ThreeDSecureParamsSchema } from '@rotki/card-payment-common/schemas/three-d-secure';
import { afterEach, describe, expect, it } from 'vitest';
import { buildThreeDSecureParams } from './three-d-secure-handoff';

const plan: SelectedPlan = { planId: 3, name: 'basic', price: 25, durationInMonths: 1 };

function breakdown(overrides: Partial<PaymentBreakdownResponse> = {}): PaymentBreakdownResponse {
  return {
    fullAmount: '25.00',
    finalAmount: '22.50',
    vatRate: '0.19',
    vatAmount: '3.59',
    renewingPrice: '25.00',
    nextPayment: 0,
    discount: null,
    ...overrides,
  };
}

const base = {
  clientToken: 'client-token',
  nonce: 'nonce-1',
  bin: '411111',
  plan,
  discountCode: '',
  upgradeSubId: undefined,
};

describe('utils/three-d-secure-handoff', () => {
  afterEach(() => {
    sessionStorage.clear();
  });

  describe('buildThreeDSecureParams', () => {
    it('builds params the 3D Secure page accepts', () => {
      const params = buildThreeDSecureParams({ ...base, breakdown: breakdown() });

      expect(ThreeDSecureParamsSchema.safeParse(params).success).toBe(true);
      expect(params).toMatchObject({
        token: 'client-token',
        planId: 3,
        amount: '25',
        finalAmount: '22.5',
        renewingPrice: '25',
        durationInMonths: 1,
        planName: 'basic',
      });
    });

    it('forwards a code only when the breakdown accepted it, with its tracking info', () => {
      const accepted = buildThreeDSecureParams({
        ...base,
        discountCode: 'DGXXOU',
        breakdown: breakdown({
          discount: { isValid: true, isReferral: true, discountType: 'percentage', discountAmount: '10', discountedAmount: '2.50' },
        }),
      });
      expect(accepted.discountCode).toBe('DGXXOU');
      expect(accepted.discountTrackingInfo).toEqual({ isReferral: true, discountType: 'percentage' });

      const rejected = buildThreeDSecureParams({
        ...base,
        discountCode: 'NOPE',
        breakdown: breakdown({ discount: { isValid: false, error: 'Unknown code' } }),
      });
      expect(rejected.discountCode).toBeUndefined();
      expect(rejected.discountTrackingInfo).toBeUndefined();
    });

    it('carries the subscription being upgraded', () => {
      expect(buildThreeDSecureParams({ ...base, breakdown: breakdown(), upgradeSubId: 'sub-7' }).upgradeSubId).toBe('sub-7');
    });
  });
});
