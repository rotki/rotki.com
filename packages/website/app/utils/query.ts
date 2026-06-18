import type { LocationQueryValue, RouteParamValue } from 'vue-router';
import type { ZodType } from 'zod';

type RouteValue = RouteParamValue | RouteParamValue[] | LocationQueryValue | LocationQueryValue[] | undefined;

/**
 * Extracts a single non-empty string from a route param or query value.
 *
 * Vue Router types params/query as `string | string[]` (query also allows
 * `null`), so reading a single value normally requires an unchecked `as string`
 * cast. This narrows safely instead: arrays collapse to their first entry, and
 * anything that is not a non-empty string yields `undefined`.
 *
 * Use this for opaque string params (ids, tokens, redirect urls). For params
 * with a shape to validate (numbers, enums) use {@link parseRouteParam}.
 */
export function getSingleRouteParam(value: RouteValue): string | undefined {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' && single.length > 0 ? single : undefined;
}

/**
 * Normalizes a route value to a single string and validates it against a Zod
 * schema, returning the parsed value or `undefined` when it is absent/invalid.
 *
 * Prefer this over `Number.parseInt(value as string)` or `value as SomeEnum`:
 * the schema both narrows the type and rejects malformed input at the boundary.
 */
export function parseRouteParam<T>(value: RouteValue, schema: ZodType<T>): T | undefined {
  const result = schema.safeParse(getSingleRouteParam(value));
  return result.success ? result.data : undefined;
}

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
