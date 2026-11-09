import type { ResultAsync } from 'plainfp/result-async';
import type { z } from 'zod';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { err, ok } from 'plainfp/result';
import { type ApiFailure, failed } from './api-failure';

/**
 * Reads a JSON response into `schema`, with its keys in camel case. A body that does not match is
 * a failure, logged with the data under `label`. A body that is not JSON throws.
 */
export async function readResponse<T>(response: Response, schema: z.ZodType<T>, label: string): ResultAsync<T, ApiFailure> {
  const data: unknown = await response.json();
  const transformedData: unknown = convertKeys(data, true, false);
  const parsed = schema.safeParse(transformedData);
  if (parsed.success)
    return ok(parsed.data);

  console.error(`Failed to parse ${label}:`, { data, error: parsed.error, transformedData });
  return err(failed('Invalid response format from server'));
}
