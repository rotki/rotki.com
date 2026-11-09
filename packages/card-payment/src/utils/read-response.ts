import type { z } from 'zod';
import { convertKeys } from '@rotki/card-payment-common/utils/object';

/**
 * Reads a JSON response into `schema`, with its keys in camel case. A body that does not match is
 * logged under `label` and reads as `undefined`, as what that means differs between the callers.
 */
export async function readResponse<T>(response: Response, schema: z.ZodType<T>, label: string): Promise<T | undefined> {
  const data: unknown = await response.json();
  const transformedData: unknown = convertKeys(data, true, false);
  const parsed = schema.safeParse(transformedData);
  if (parsed.success)
    return parsed.data;

  console.error(`Failed to parse ${label}:`, { data, error: parsed.error, transformedData });
  return undefined;
}
