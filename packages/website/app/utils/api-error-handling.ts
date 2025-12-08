import type { SafeParseError } from 'zod';
import type { Result } from '~/types';
import type { ActionResult } from '~/types/common';
import type { useLogger } from '~/utils/use-logger';
import { ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { FetchError } from 'ofetch';
import { PaymentError } from '~/types/codes';

/**
 * Check if error is a 401 Unauthorized response
 */
export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof FetchError && error.statusCode === 401;
}

/**
 * Extract error message from various error types
 */
export function getErrorMessage(error: any): string {
  if (error instanceof FetchError) {
    const status = error?.status || -1;
    if (status === 400 && error.response) {
      const parsed = ActionResultResponseSchema.safeParse(error.data);
      if (parsed.success) {
        return parsed.data.message || 'Unknown error';
      }
      return error.data?.message || error.message || 'Unknown error';
    }
  }
  return error.message || 'An unknown error occurred';
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
 * Handle payment API errors with specific error codes
 */
export function handlePaymentError<T>(originalError: any): Result<T, PaymentError> {
  let error = originalError;
  let code: PaymentError | undefined;

  if (originalError instanceof FetchError) {
    if (originalError.status === 400) {
      const parsed = ActionResultResponseSchema.safeParse(originalError.data);
      const message = parsed.success ? parsed.data.message : originalError.message;
      error = new Error(message);
    }
    else if (originalError.status === 403) {
      error = '';
      code = PaymentError.UNVERIFIED;
    }
  }

  return {
    code,
    error,
    isError: true,
  };
}

/**
 * Create simple error result for Result type
 */
export function createSimpleErrorResult(error: any): Result<any> {
  return {
    error,
    isError: true,
  };
}

/**
 * Log safeParse failure and return fallback value
 */
export function logParseFailure<T>(
  parseResult: SafeParseError<any>,
  logger: ReturnType<typeof useLogger>,
  context: string,
  rawData: any,
  fallback: T,
): T {
  logger.error(`Failed to parse ${context}:`, {
    rawData,
    zodErrors: parseResult.error.errors,
  });
  return fallback;
}
