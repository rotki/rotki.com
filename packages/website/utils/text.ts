/**
 *
 * @param {string} string - String to convert
 * @return {string} - String converted to title case
 * @example
 * toTitleCase('this is a sentence'); // This Is A Sentence
 */
export function toTitleCase(string: string): string {
  if (!string)
    return '';

  const spacedString = string.replace(/_/g, ' ');

  return spacedString.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function formatSeconds(number: number): { minutes?: number; seconds?: number } {
  const rounded = Math.floor(number);
  const minutes = Math.floor(rounded / 60);
  const seconds = rounded % 60;

  const result: { minutes?: number; seconds?: number } = {};
  if (minutes > 0)
    result.minutes = minutes;
  if (seconds > 0)
    result.seconds = seconds;

  return result;
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

export function removeTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}
