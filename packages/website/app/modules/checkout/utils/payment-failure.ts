import type { ResultAsync } from 'plainfp/result-async';
import type { z } from 'zod';
import { ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { FetchError } from 'ofetch';
import { err, ok } from 'plainfp/result';
import { tag, type Tagged } from 'plainfp/tagged';
import { SERVER_ERROR_MESSAGE, UnreadableResponseError } from '~/utils/api-error-handling';
import { nonEmpty } from '~/utils/non-empty';

/**
 * Why a payment API call failed.
 *
 * - `Rejected`: the backend refused and wrote the message for the buyer (a decline, a validation).
 * - `Unverified`: the account has to verify its e-mail address first.
 * - `ServerError`: the server failed or could not be reached, so a charge may have gone through.
 * - `Unexpected`: a bug or a response in an unknown shape. Its message is never shown.
 */
export type PaymentFailure =
  | Tagged<'Rejected', { message: string }>
  | Tagged<'Unverified'>
  | Tagged<'ServerError', { cause: unknown }>
  | Tagged<'Unexpected', { cause: unknown }>;

const UNVERIFIED_MESSAGE = 'You need to first verify your e-mail address.';

export function rejected(message: string): PaymentFailure {
  return tag('Rejected')({ message });
}

export function unexpected(cause: unknown): PaymentFailure {
  return tag('Unexpected')({ cause });
}

/** Sorts whatever a payment API call threw into a {@link PaymentFailure}. */
export function toPaymentFailure(cause: unknown): PaymentFailure {
  if (cause instanceof UnreadableResponseError)
    return tag('ServerError')({ cause });
  if (!(cause instanceof FetchError))
    return unexpected(cause);
  if (cause.status === 403)
    return tag('Unverified')();
  if (cause.status !== 400)
    return tag('ServerError')({ cause });

  const parsed = ActionResultResponseSchema.safeParse(cause.data);
  return rejected((parsed.success ? nonEmpty(parsed.data.message) : undefined) ?? SERVER_ERROR_MESSAGE);
}

/** The copy for a failure; only `Rejected` carries a message from outside this file. */
export function paymentFailureMessage(failure: PaymentFailure): string {
  switch (failure._tag) {
    case 'Rejected':
      return failure.message;
    case 'Unverified':
      return UNVERIFIED_MESSAGE;
    case 'ServerError':
    case 'Unexpected':
      return SERVER_ERROR_MESSAGE;
  }
}

/** Whether the request may have been carried out even though it failed, so a charge cannot be ruled out. */
export function isOutcomeUnknown(failure: PaymentFailure): boolean {
  switch (failure._tag) {
    case 'Rejected':
    case 'Unverified':
      return false;
    case 'ServerError':
    case 'Unexpected':
      return true;
  }
}

/**
 * Reads the `{ result, message }` body of a 200 response. A missing or false `result` is the
 * backend refusing; a body that does not match the schema is `Unexpected`.
 */
export function parseApiResult<T>(schema: z.ZodType<{ message?: unknown; result?: T }>): (response: unknown) => ResultAsync<NonNullable<T>, PaymentFailure> {
  return async (response: unknown): ResultAsync<NonNullable<T>, PaymentFailure> => {
    const parsed = schema.safeParse(response);
    if (!parsed.success)
      return err(unexpected(parsed.error));

    const { message, result } = parsed.data;
    if (result)
      return ok(result);
    return err(rejected((typeof message === 'string' ? nonEmpty(message) : undefined) ?? SERVER_ERROR_MESSAGE));
  };
}
