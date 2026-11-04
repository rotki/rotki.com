import type { PaymentBreakdownDiscount, PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { ThreeDSecureParams } from '@rotki/card-payment-common/schemas/three-d-secure';
import { getValidDiscountCode } from '@rotki/card-payment-common/utils/checkout';

export interface PaymentAmounts {
  finalAmount: number;
  renewingPrice: number;
}

/** What the buyer pays today and on renewal; the plan price until the breakdown has loaded. */
export function paymentAmounts(breakdown: PaymentBreakdownResponse | undefined, plan: SelectedPlan): PaymentAmounts {
  if (!breakdown)
    return { finalAmount: plan.price, renewingPrice: plan.price };

  return {
    finalAmount: parseFloat(breakdown.finalAmount),
    renewingPrice: parseFloat(breakdown.renewingPrice),
  };
}

export interface ThreeDSecureHandoffInput {
  clientToken: string;
  nonce: string;
  bin: string;
  plan: SelectedPlan;
  breakdown: PaymentBreakdownResponse | undefined;
  discountCode: string;
  upgradeSubId: string | undefined;
}

/** Data the website's 3D Secure page needs to verify and complete the payment. */
export function buildThreeDSecureParams(input: ThreeDSecureHandoffInput): ThreeDSecureParams {
  const { clientToken, nonce, bin, plan, breakdown, discountCode, upgradeSubId } = input;
  const discount: PaymentBreakdownDiscount | undefined = breakdown?.discount ?? undefined;
  const { finalAmount, renewingPrice } = paymentAmounts(breakdown, plan);

  return {
    token: clientToken,
    planId: plan.planId,
    amount: plan.price.toString(),
    finalAmount: finalAmount.toString(),
    renewingPrice: renewingPrice.toString(),
    nonce,
    bin,
    discountCode: getValidDiscountCode(discount, discountCode || undefined),
    upgradeSubId,
    durationInMonths: plan.durationInMonths,
    planName: plan.name,
    discountTrackingInfo: discount?.isValid === true
      ? { isReferral: discount.isReferral, discountType: discount.discountType }
      : undefined,
  };
}
