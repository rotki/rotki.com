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

/** Discount code sources a checkout page can apply, in the order they are considered. */
export interface DiscountCodeSources {
  /** Code the buyer brought or typed (the `discountCode` query param). */
  explicit?: string;
  /** Whether the buyer removed an auto-applied code; blocks the fallbacks below. */
  dismissed?: boolean;
  referral?: string;
  campaign?: string;
}

/**
 * Picks the discount code to apply: an explicit code always wins, then the referral code,
 * then the sitewide campaign code. A dismissal only blocks the automatic fallbacks.
 */
export function resolveDiscountCode({ explicit, dismissed, referral, campaign }: DiscountCodeSources): string | undefined {
  if (explicit)
    return explicit;
  if (dismissed)
    return undefined;
  return [referral, campaign].find(Boolean);
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
