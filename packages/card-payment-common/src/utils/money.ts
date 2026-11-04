/**
 * Money helpers shared by the website checkout and the card payment app.
 *
 * Amounts are EUR. The API sends them as decimal strings ("25.00"), the plan list as
 * numbers, so every helper accepts both. Arithmetic happens in integer cents to keep
 * floating-point noise out of the displayed values.
 */

const eurFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value.trim() || Number.NaN);
}

function normalizeZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

/**
 * Shifts the decimal point by two places through the string form of the number, so
 * values like 1.005 round as written (101 cents) instead of as their binary
 * approximation (100.49999 cents).
 */
function shiftToCents(value: number): number {
  const text = String(Math.abs(value));
  return text.includes('e') ? Math.abs(value) * 100 : Number(`${text}e2`);
}

/**
 * Converts an EUR amount to integer cents, rounding half away from zero.
 * Returns NaN when the value is not a finite number.
 *
 * @example
 * toCents('25.00') // 2500
 * toCents(3.585) // 359
 */
export function toCents(value: number | string): number {
  const amount = toNumber(value);
  if (!Number.isFinite(amount))
    return Number.NaN;
  const cents = Math.round(shiftToCents(amount));
  return normalizeZero(amount < 0 ? -cents : cents);
}

/** Converts integer cents back to an EUR amount, never returning -0. */
export function fromCents(cents: number): number {
  return normalizeZero(cents / 100);
}

/**
 * Formats an EUR amount the one way the checkout shows money: two decimals, `en`
 * grouping and a space before the euro sign. Returns an empty string for values that
 * are not numbers, so a malformed amount never renders as "NaN €".
 *
 * @example
 * formatEur(25) // "25.00 €"
 * formatEur('1234.5') // "1,234.50 €"
 */
export function formatEur(value: number | string): string {
  const cents = toCents(value);
  if (Number.isNaN(cents))
    return '';
  return `${eurFormatter.format(fromCents(cents))} €`;
}

/**
 * Formats a percentage (10 means 10%) with at most two decimals and no trailing zeros.
 * Rounds like money, in hundredths, so 0.004 renders as "0%" rather than "-0%" or "0.00%".
 * Returns an empty string for values that are not numbers.
 *
 * @example
 * formatPercent('10.00') // "10%"
 * formatPercent(12.5) // "12.5%"
 */
export function formatPercent(value: number | string): string {
  const hundredths = toCents(value);
  if (Number.isNaN(hundredths))
    return '';
  return `${percentFormatter.format(fromCents(hundredths))}%`;
}

/**
 * Amount saved between the price before a discount and the amount actually paid,
 * computed in cents. Negative when the paid amount is higher.
 *
 * @example
 * discountAmount(49, 19.99) // 29.01
 * discountAmount(19.99, 19.99) // 0
 */
export function discountAmount(priceBeforeDiscount: number | string, paidAmount: number | string): number {
  return fromCents(toCents(priceBeforeDiscount) - toCents(paidAmount));
}
