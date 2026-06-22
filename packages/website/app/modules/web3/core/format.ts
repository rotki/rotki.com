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
