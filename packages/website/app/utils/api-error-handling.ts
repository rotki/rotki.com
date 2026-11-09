import type { ZodSafeParseError } from 'zod';
import type { ActionResult } from '~/types/common';
import type { useLogger } from '~/utils/use-logger';
import { ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { FetchError } from 'ofetch';
import { nonEmpty } from '~/utils/non-empty';

/** What a buyer reads when the server failed; the technical detail only goes to the logs. */
export const SERVER_ERROR_MESSAGE = 'Something went wrong on our side. Please try again.';

/** The server answered with a body that is not JSON, such as a framework's plain text 500 page. */
export class UnreadableResponseError extends Error {
  constructor(message: string = SERVER_ERROR_MESSAGE, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UnreadableResponseError';
  }
}

/**
 * Parses an API response body. A body that is not JSON fails with copy a buyer can read, since
 * callers show `error.message` and the parser's own message quotes the start of the body.
 */
export function parseJsonBody(body: string): unknown {
  try {
    return JSON.parse(body);
  }
  catch (error) {
    throw new UnreadableResponseError(SERVER_ERROR_MESSAGE, { cause: error });
  }
}

/**
 * Check if error is a 401 Unauthorized response
 */
export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof FetchError && error.statusCode === 401;
}

/**
 * Extract the message from a 400 response body, preferring the parsed
 * ActionResult message and falling back to the raw payload/error message.
 */
function extractBadRequestMessage(error: FetchError): string {
  const parsed = ActionResultResponseSchema.safeParse(error.data);
  if (parsed.success)
    return nonEmpty(parsed.data.message) ?? 'Unknown error';

  return nonEmpty(error.data?.message) ?? nonEmpty(error.message) ?? 'Unknown error';
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: any): string {
  if (error instanceof FetchError && error.status === 400 && error.response)
    return extractBadRequestMessage(error);

  return nonEmpty(error.message) ?? 'An unknown error occurred';
}

/**
 * Create ActionResult from error
 */
export function createErrorResult(error: any): ActionResult {
  return {
    message: getErrorMessage(error),
    success: false,
  };
}

/**
 * Create success ActionResult
 */
export function createSuccessResult(): ActionResult {
  return { success: true };
}

/**
 * Log safeParse failure and return fallback value
 */
export function logParseFailure<T>(
  parseResult: ZodSafeParseError<any>,
  logger: ReturnType<typeof useLogger>,
  context: string,
  rawData: any,
  fallback: T,
): T {
  logger.error(`Failed to parse ${context}:`, {
    rawData,
    zodErrors: parseResult.error.issues,
  });
  return fallback;
}
