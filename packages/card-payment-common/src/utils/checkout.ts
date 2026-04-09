import type { PaymentBreakdownCredit, PaymentBreakdownDiscount } from '../schemas/plans';

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

/**
 * Formats the credited amount from a payment breakdown credit response.
 * Returns undefined if the credit is missing or the amount is non-positive.
 */
export function formatCreditedAmount(credit: PaymentBreakdownCredit | null | undefined): string | undefined {
  if (!credit)
    return undefined;
  const amount = parseFloat(credit.creditedAmount);
  if (!isFinite(amount) || amount <= 0)
    return undefined;
  return amount.toFixed(2);
}
