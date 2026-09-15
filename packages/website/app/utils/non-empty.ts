/**
 * Returns `value` unless it is `null`, `undefined` or an empty string.
 *
 * Use it as `nonEmpty(value) ?? fallback` wherever an empty string must fall
 * through to the fallback like it did with `value || fallback`; a plain `??`
 * would keep the empty string.
 */
export function nonEmpty<T>(value: T | null | undefined): T | undefined {
  if (value === null || value === undefined || value === '')
    return undefined;
  return value;
}
