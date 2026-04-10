// Typed camelCase → snake_case key conversion.
// Used at tracking boundaries so payload interfaces stay camelCase (matching
// the codebase convention) while the analytics layer receives snake_case keys.

/**
 * Convert a camelCase string literal to snake_case at the type level.
 *
 * Examples:
 *   CamelToSnakeCase<'paymentMethod'>  → 'payment_method'
 *   CamelToSnakeCase<'planId'>         → 'plan_id'
 *   CamelToSnakeCase<'isUpgrade'>      → 'is_upgrade'
 *   CamelToSnakeCase<'currency'>       → 'currency'
 */
export type CamelToSnakeCase<S extends string> =
  S extends `${infer Head}${infer Tail}`
    ? Tail extends Uncapitalize<Tail>
      ? `${Lowercase<Head>}${CamelToSnakeCase<Tail>}`
      : `${Lowercase<Head>}_${CamelToSnakeCase<Tail>}`
    : S;

/**
 * Map every key of `T` from camelCase to snake_case, preserving value types.
 */
export type SnakeCaseKeys<T> = {
  [K in keyof T as K extends string ? CamelToSnakeCase<K> : K]: T[K];
};

/**
 * Convert a single camelCase string to snake_case at runtime.
 */
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Convert all keys of a flat object from camelCase to snake_case.
 * Returns a new object — the input is not mutated.
 */
export function toSnakeCaseKeys<T extends object>(obj: T): SnakeCaseKeys<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[camelToSnake(key)] = value;
  }
  return result as SnakeCaseKeys<T>;
}
