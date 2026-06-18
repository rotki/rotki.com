// camelCase → snake_case key conversion.
// Used at tracking boundaries so payload interfaces stay camelCase (matching
// the codebase convention) while the analytics layer receives snake_case keys.

/**
 * Convert a single camelCase string to snake_case at runtime.
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert all keys of a flat object from camelCase to snake_case.
 * Returns a new object — the input is not mutated.
 *
 * The return type is intentionally the loose `Record<string, unknown>`: every
 * consumer (sigilTrack/buildTrackedEventData/JSON.stringify) only needs that, so
 * there is no reason to assert a precise mapped type the runtime can't verify.
 */
export function toSnakeCaseKeys<T extends object>(obj: T): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result;
}
