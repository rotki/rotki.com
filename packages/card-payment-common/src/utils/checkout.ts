import type { CheckoutData, UpgradeData } from '../schemas/checkout';
import type { DiscountInfo } from '../schemas/discount';
import type { SelectedPlan } from '../schemas/plans';

/**
 * Type guard to check if the checkout data is for an upgrade
 */
export function isUpgradeData(
  data: CheckoutData | UpgradeData,
): data is UpgradeData {
  return 'finalAmount' in data;
}

/**
 * Calculate the final amount to charge based on checkout data, plan, and discount
 *
 * Priority:
 * 1. If upgrade data exists, use its finalAmount
 * 2. If valid discount exists, use its finalPrice
 * 3. Otherwise, use the plan's base price
 */
export function getFinalAmount(
  data: CheckoutData | UpgradeData,
  selectedPlan: SelectedPlan,
  discountInfo?: DiscountInfo,
): number {
  // If upgrade, return parsed finalAmount
  if (isUpgradeData(data)) {
    return parseFloat(data.finalAmount);
  }

  // If valid discount exists, use its finalPrice
  if (discountInfo?.isValid && discountInfo.finalPrice) {
    return discountInfo.finalPrice;
  }

  // Default to plan price
  return selectedPlan.price;
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
