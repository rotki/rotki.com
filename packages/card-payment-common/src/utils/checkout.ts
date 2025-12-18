import type { DiscountInfo } from '../schemas/discount';
import type { PaymentBreakdownResponse, SelectedPlan } from '../schemas/plans';

/**
 * Calculate the final amount to charge based on checkout data and discount
 *
 * Priority:
 * 1. If valid discount exists, use its finalPrice
 * 2. Otherwise, use the breakdown response finalAmount
 */
export function getFinalAmount(
  data: PaymentBreakdownResponse,
  _selectedPlan: SelectedPlan,
  discountInfo?: DiscountInfo,
): number {
  // If valid discount exists, use its finalPrice
  if (discountInfo?.isValid && discountInfo.finalPrice) {
    return discountInfo.finalPrice;
  }

  // Use the finalAmount from breakdown response
  return parseFloat(data.finalAmount);
}

/**
 * Calculate the discounted price for a plan
 * Use this for payment flows without upgrade data (e.g., crypto payments)
 *
 * Priority:
 * 1. If valid discount exists, use its finalPrice
 * 2. Otherwise, use the plan's base price
 */
export function getDiscountedPrice(
  selectedPlan: SelectedPlan,
  discountInfo?: DiscountInfo,
): number {
  // If valid discount exists, use its finalPrice
  if (discountInfo?.isValid && discountInfo.finalPrice) {
    return discountInfo.finalPrice;
  }

  // Default to plan price
  return selectedPlan.price;
}
