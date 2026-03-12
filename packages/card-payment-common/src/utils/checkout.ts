import type { PaymentBreakdownDiscount } from '../schemas/plans';

/**
 * Returns the discount code only if the breakdown confirms it is valid.
 * Use this to guard payment submissions against stale or rejected codes.
 */
export function getValidDiscountCode(
  discount: PaymentBreakdownDiscount | null | undefined,
  code: string | undefined,
): string | undefined {
  if (!code)
    return undefined;
  return discount?.isValid === true ? code : undefined;
}
