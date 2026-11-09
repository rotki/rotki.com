import type { ResultAsync } from 'plainfp/result-async';
import { PaymentUserError } from '@rotki/sigil';
import { err } from 'plainfp/result';
import { tag, type Tagged } from 'plainfp/tagged';

/**
 * Why a request to the backend failed.
 *
 * - `UserFacing`: `message` is copy for the buyer. `cardAdded` says the backend vaulted the card
 *   before it failed, so the saved cards are stale.
 * - `Failed`: anything else. `message` is for the logs and comes from the backend or the browser.
 */
export type ApiFailure =
  | Tagged<'UserFacing', { message: string; logDetail: string; cardAdded: boolean }>
  | Tagged<'Failed', { message: string }>;

export function userFacing(message: string, logDetail: string, cardAdded: boolean): ApiFailure {
  return tag('UserFacing')({ message, logDetail, cardAdded });
}

export function failed(message: string): ApiFailure {
  return tag('Failed')({ message });
}

/** Whether the backend vaulted the card even though the request failed. */
export function isCardAdded(failure: ApiFailure): boolean {
  return failure._tag === 'UserFacing' && failure.cardAdded;
}

/**
 * The failure as the error `@rotki/sigil` reads to pick what to log and what to show, which is
 * also what it does with the errors the Braintree SDK throws.
 */
export function toPaymentError(failure: ApiFailure): Error {
  return failure._tag === 'UserFacing'
    ? new PaymentUserError(failure.message, { logDetail: failure.logDetail })
    : new Error(failure.message);
}

function messageOf(cause: unknown, fallback: string): string {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

/** Runs a request, logging any failure once under `label` and turning what it throws into one. */
export async function attempt<T>(label: string, run: () => ResultAsync<T, ApiFailure>): ResultAsync<T, ApiFailure> {
  try {
    const result = await run();
    if (!result.ok)
      console.error(`${label}:`, result.error);
    return result;
  }
  catch (error) {
    console.error(`${label}:`, error);
    return err(failed(messageOf(error, label)));
  }
}
