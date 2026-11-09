import type { PaymentBreakdownDiscount, PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { ThreeDSecureParams } from '@rotki/card-payment-common/schemas/three-d-secure';
import { getValidDiscountCode } from '@rotki/card-payment-common/utils/checkout';
import { paymentAmounts } from '@rotki/card-payment-common/utils/plan';

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
