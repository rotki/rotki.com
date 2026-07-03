/**
 * Trims a human-readable token balance to at most `maxDecimals` fractional digits
 * for display, dropping trailing zeros. Operates on the decimal string directly
 * (no `Number` round-trip) so large/precise balances keep their integer part
 * exactly. Returns the value unchanged when it has no fractional part.
 * @example formatTokenBalance('0.188476330975533262') // '0.188476'
 */
export function formatTokenBalance(value: string, maxDecimals = 6): string {
  const dotIndex = value.indexOf('.');
  if (dotIndex === -1)
    return value;

  const whole = value.slice(0, dotIndex);
  const trimmed = value.slice(dotIndex + 1, dotIndex + 1 + maxDecimals).replace(/0+$/, '');
  return trimmed ? `${whole}.${trimmed}` : whole;
}

/**
 * How many fractional digits `value` needs to display without losing information:
 * trailing zeros dropped, capped at `maxDecimals`. Operates on the string directly.
 * @example significantDecimals('200.000000000') // 0
 * @example significantDecimals('300.10000000')  // 1
 */
export function significantDecimals(value: string, maxDecimals = 6): number {
  const dotIndex = value.indexOf('.');
  if (dotIndex === -1)
    return 0;

  return value.slice(dotIndex + 1, dotIndex + 1 + maxDecimals).replace(/0+$/, '').length;
}

/**
 * The common number of fractional digits a set of amounts should be displayed with
 * so they line up: the max any single value needs (trailing zeros dropped), capped
 * at `maxDecimals`. Returns 0 for an empty set.
 * @example alignmentDecimals(['200.000', '300.000']) // 0
 * @example alignmentDecimals(['200', '300.1'])       // 1
 */
export function alignmentDecimals(values: string[], maxDecimals = 6): number {
  return Math.max(0, ...values.map(value => significantDecimals(value, maxDecimals)));
}

/**
 * Formats `value` to exactly `decimals` fractional digits, padding with trailing
 * zeros or truncating extra digits (no rounding). Operates on the string directly
 * so the integer part stays exact.
 * @example toFixedDecimals('200', 1)          // '200.0'
 * @example toFixedDecimals('300.10000000', 1) // '300.1'
 */
export function toFixedDecimals(value: string, decimals: number): string {
  const dotIndex = value.indexOf('.');
  const whole = dotIndex === -1 ? value : value.slice(0, dotIndex);
  if (decimals === 0)
    return whole;

  const frac = dotIndex === -1 ? '' : value.slice(dotIndex + 1, dotIndex + 1 + decimals);
  return `${whole}.${frac.padEnd(decimals, '0')}`;
}

/**
 * Aligns a set of decimal amount strings to a common number of fractional digits
 * (see {@link alignmentDecimals}), so a column of amounts lines up while dropping
 * trailing zeros that every value shares.
 * @example alignAmounts(['200.000', '300.000']) // ['200', '300']
 * @example alignAmounts(['200', '300.1'])       // ['200.0', '300.1']
 */
export function alignAmounts(values: string[], maxDecimals = 6): string[] {
  const decimals = alignmentDecimals(values, maxDecimals);
  return values.map(value => toFixedDecimals(value, decimals));
}

/**
 * Truncates blockchain hashes (addresses / txs) retaining `truncLength+2` characters
 * from the beginning and `truncLength` characters from the end of the string.
 * @param address
 * @param [truncLength]
 * @returns truncated address
 */
export function truncateAddress(address: string, truncLength = 4): string {
  const startPadding = address.startsWith('0x')
    ? 2
    : 0;

  const length = address.length;

  if (length <= truncLength * 2 + startPadding)
    return address;

  return `${address.slice(0, truncLength + startPadding)}...${address.slice(
    length - truncLength,
    length,
  )}`;
}
