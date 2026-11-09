import type { ResultAsync } from 'plainfp/result-async';
import {
  type AddCardPayload,
  type CreateCardNoncePayload,
  CreateCardNonceResponseSchema,
  type SavedCard,
  SavedCardResponseSchema,
  SavedCardSchema,
} from '@rotki/card-payment-common/schemas/payment';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { checkoutMessages } from '@rotki/checkout-ui/messages/en';
import { addCardErrorMessage, isCardAddedFailure } from '@rotki/checkout-ui/utils/add-card-error';
import { createTranslator } from '@rotki/checkout-ui/utils/translator';
import { buildTrackedEventData, type CardType, type CheckoutStep, logPaymentFailure, monthsToPlanDuration, parseBraintreeError, parseTrackingSessionCookie, type PaymentFailureKey, PaymentFailures, SigilEvents, sigilTrack, toSnakeCaseKeys, type TrackingSession } from '@rotki/sigil';
import { err, map, ok } from 'plainfp/result';
import { z } from 'zod';
import { paths } from '@/config/paths';
import { paymentMessageFor } from '@/utils/payment-error';
import { fetchWithCSRF } from './api';
import { type ApiFailure, attempt, failed, userFacing } from './api-failure';
import { readResponse } from './read-response';

interface CardSubmittedInput {
  planId: number;
  durationInMonths: number;
  isUpgrade: boolean;
  cardType: CardType;
  discountApplied: boolean;
}

interface CardFailureInput {
  failure: PaymentFailureKey;
  errorMessage: string;
  planId?: number;
  isUpgrade: boolean;
  step: CheckoutStep;
  errorCode?: string;
  cardType?: CardType;
  discountApplied?: boolean;
}

const BackendErrorSchema = z.object({
  code: z.string().optional(),
  message: z.string(),
});

const t = createTranslator(checkoutMessages);

type BackendError = z.infer<typeof BackendErrorSchema>;

/** The attribution session the website stored. Tracking must never break a payment, so a blocked cookie read gives none. */
function readTrackingSession(): TrackingSession | undefined {
  try {
    return parseTrackingSessionCookie(document.cookie);
  }
  catch {
    return undefined;
  }
}

function trackWithAttribution(event: string, data: object): void {
  sigilTrack(event, buildTrackedEventData(toSnakeCaseKeys(data), readTrackingSession()));
}

export function trackCardPaymentSubmitted({ planId, durationInMonths, isUpgrade, cardType, discountApplied }: CardSubmittedInput): void {
  trackWithAttribution(SigilEvents.PAYMENT_SUBMITTED, {
    paymentMethod: 'card',
    planId,
    planDuration: monthsToPlanDuration(durationInMonths),
    isUpgrade,
    cardType,
    discountApplied,
  });
}

/**
 * Fire-and-forget card payment failure logger.
 * Posts to the backend for observability and mirrors a coarse category into
 * Sigil so the funnel shows alongside the rest of the rotki.com site. The
 * server event name and Sigil reason are both sourced from the shared
 * `@rotki/sigil` catalog so the two destinations can never drift.
 */
export function trackCardPaymentFailure({ failure, errorMessage, planId, isUpgrade, step, errorCode, cardType, discountApplied }: CardFailureInput): void {
  logPaymentFailure({
    paymentMethod: 'card',
    event: PaymentFailures[failure].serverEvent,
    errorMessage,
    errorCode,
    planId,
    step,
    isUpgrade,
    cardType,
    discountApplied,
  }, trackWithAttribution);
}

/**
 * Report a failed card operation and return the copy to show the buyer.
 *
 * The two halves belong together: the SDK's own message is what gets logged
 * (with the Cardinal detail `parseBraintreeError` recovers), and is exactly
 * what must not reach the buyer unless `paymentErrorCopy` says so. Deriving
 * both from one parse keeps a caller from logging one thing and rendering
 * another.
 */
export function reportCardFailure(
  error: unknown,
  context: Omit<CardFailureInput, 'errorMessage' | 'errorCode'>,
): string {
  const parsed = parseBraintreeError(error);

  trackCardPaymentFailure({
    ...context,
    errorMessage: parsed.logMessage,
    errorCode: parsed.code,
  });

  return paymentMessageFor(parsed);
}

function extractBackendError(errorText: string): BackendError {
  try {
    const parsed: unknown = JSON.parse(errorText);
    const result = BackendErrorSchema.safeParse(parsed);
    if (result.success)
      return result.data;
  }
  catch { /* JSON parse failed */ }
  return { message: errorText };
}

async function backendFailure(response: Response): Promise<ApiFailure> {
  return failed(extractBackendError(await response.text()).message);
}

/** Only copy written for the buyer can reach the screen; anything else is an HTTP dump and stays opaque. */
async function addCardFailure(response: Response): Promise<ApiFailure> {
  const { code, message: backendMessage } = extractBackendError(await response.text());
  const failure = { code, message: backendMessage, status: response.status };
  const message = addCardErrorMessage(t, failure);

  return message
    ? userFacing(message, backendMessage, isCardAddedFailure(failure))
    : failed(`HTTP ${response.status}: ${backendMessage}`);
}

export async function addCard(payload: AddCardPayload): ResultAsync<string, ApiFailure> {
  return attempt('Failed to add card', async () => {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      body: JSON.stringify(convertKeys(payload, false, false)),
      method: 'POST',
    });

    if (!response.ok)
      return err(await addCardFailure(response));

    return map(await readResponse(response, SavedCardSchema, 'SavedCard response'), card => card.token);
  });
}

export async function createCardNonce(payload: CreateCardNoncePayload): ResultAsync<string, ApiFailure> {
  return attempt('Failed to create card nonce', async () => {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/nonce/`, {
      body: JSON.stringify(convertKeys(payload, false, false)),
      method: 'POST',
    });

    if (!response.ok)
      return err(await backendFailure(response));

    return map(await readResponse(response, CreateCardNonceResponseSchema, 'CreateCardNonce response'), parsed => parsed.paymentNonce);
  });
}

export async function deleteCard(token: string): ResultAsync<undefined, ApiFailure> {
  return attempt('Failed to delete card', async () => {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      body: JSON.stringify({ payment_token: token }),
      method: 'DELETE',
    });

    return response.ok ? ok(undefined) : err(await backendFailure(response));
  });
}

/** The saved cards. A 404 means there are none, which is different from failing to load them. */
export async function getSavedCard(): ResultAsync<SavedCard[], ApiFailure> {
  return attempt('Failed to get saved card', async () => {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      method: 'GET',
    });

    if (response.status === 404)
      return ok([]);

    if (!response.ok)
      return err(await backendFailure(response));

    return map(await readResponse(response, SavedCardResponseSchema, 'SavedCardResponse'), parsed => parsed.cards);
  });
}
