/**
 * Builds query parameters from an object, filtering out null, undefined, and empty string values
 * @param params - Object containing potential query parameters
 * @returns Record with only defined, non-empty string values
 */
export function buildQueryParams(params: Record<string, any>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(params)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );
}
