import { formatCurrency } from '~/utils/text';

export interface DiscountInfo {
  discount: number;
  freeMonths: number;
  originalPrice: string;
  monthlyPrice: string;
}

/**
 * Calculates discount information for yearly plans
 * Returns undefined if there's no savings or invalid prices
 */
export function calculateYearlyDiscount(
  monthlyPrice: string,
  yearlyPrice: string,
): DiscountInfo | undefined {
  const monthly = Number.parseFloat(monthlyPrice);
  const yearly = Number.parseFloat(yearlyPrice);

  if (Number.isNaN(monthly) || Number.isNaN(yearly) || monthly <= 0 || yearly <= 0) {
    return undefined;
  }

  const monthlyTotal = monthly * 12;
  const savings = monthlyTotal - yearly;

  if (savings <= 0) {
    return undefined;
  }

  const discountPercentage = Math.round((savings / monthlyTotal) * 100);
  const freeMonths = Math.round(savings / monthly);

  return {
    discount: discountPercentage,
    freeMonths,
    monthlyPrice: formatCurrency(yearly / 12),
    originalPrice: formatCurrency(monthlyTotal),
  };
}
