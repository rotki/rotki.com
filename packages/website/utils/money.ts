/**
 * Calculate the discount amount between the price before discount and the final EUR amount.
 *
 * This function avoids floating-point precision issues by performing arithmetic
 * in integer cents. It also normalizes negative zero to regular zero to prevent
 * displaying "-0.00" in the UI.
 *
 * @param priceBeforeDiscount - The original price before any discount (in EUR).
 * @param eurAmount - The final amount paid after discount (in EUR).
 * @returns The discount amount formatted as a string with exactly two decimals.
 *
 * @example
 * discountAmount(49, 19.99) // "29.01"
 * discountAmount(50, 49.99) // "0.01"
 * discountAmount(19.99, 19.99) // "0.00"
 */
export function discountAmount(priceBeforeDiscount: number, eurAmount: number): string {
  const beforeCents = Math.round(priceBeforeDiscount * 100);
  const eurCents = Math.round(eurAmount * 100);

  const diffCents = beforeCents - eurCents;
  const diff = diffCents / 100;

  // Normalize -0 to 0 to avoid output like "-0.00"
  const normalized = Object.is(diff, -0) ? 0 : diff;
  return normalized.toFixed(2);
}
