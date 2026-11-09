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
import { type CardType, type CheckoutStep, monthsToPlanDuration, parseBraintreeError, type PaymentFailureKey, PaymentFailures, PaymentUserError, postPaymentLog, SigilEvents, sigilTrack, toSnakeCaseKeys } from '@rotki/sigil';
import { z } from 'zod';
import { paths } from '@/config/paths';
import { paymentMessageFor } from '@/utils/payment-error';
import { fetchWithCSRF } from './api';

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

/**
 * The backend vaulted the card before the add failed, so callers must refresh
 * their saved cards. Customer copy, hence `PaymentUserError`.
 */
export class CardAddedPaymentError extends PaymentUserError {
  constructor(message: string, options?: ErrorOptions & { logDetail?: string }) {
    super(message, options);
    this.name = 'CardAddedPaymentError';
  }
}

export function trackCardPaymentSubmitted({ planId, durationInMonths, isUpgrade, cardType, discountApplied }: CardSubmittedInput): void {
  sigilTrack(SigilEvents.PAYMENT_SUBMITTED, toSnakeCaseKeys({
    paymentMethod: 'card',
    planId,
    planDuration: monthsToPlanDuration(durationInMonths),
    isUpgrade,
    cardType,
    discountApplied,
  }));
}

/**
 * Fire-and-forget card payment failure logger.
 * Posts to the backend for observability and mirrors a coarse category into
 * Sigil so the funnel shows alongside the rest of the rotki.com site. The
 * server event name and Sigil reason are both sourced from the shared
 * `@rotki/sigil` catalog so the two destinations can never drift.
 */
export function trackCardPaymentFailure({ failure, errorMessage, planId, isUpgrade, step, errorCode, cardType, discountApplied }: CardFailureInput): void {
  const entry = PaymentFailures[failure];

  postPaymentLog({
    paymentMethod: 'card',
    event: entry.serverEvent,
    errorMessage,
    errorCode,
    planId,
    step,
    isUpgrade,
    cardType,
    discountApplied,
  });

  sigilTrack(SigilEvents.PAYMENT_FAILED, toSnakeCaseKeys({
    paymentMethod: 'card',
    reason: entry.reason,
    planId,
    isUpgrade,
    step,
    cardType,
    discountApplied,
  }));
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

/**
 * The caught error's `message`, or `fallback` when it has no string message or
 * the message is empty (an empty message must still fall back).
 */
function caughtMessageOr(error: unknown, fallback: string): string {
  if (typeof error !== 'object' || error === null || !('message' in error))
    return fallback;

  const { message } = error;
  return typeof message === 'string' && message !== '' ? message : fallback;
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

export async function addCard(payload: AddCardPayload): Promise<string> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      body: JSON.stringify(convertKeys(payload, false, false)),
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      const { code, message: backendMessage } = extractBackendError(errorText);
      const failure = { code, message: backendMessage, status: response.status };
      const message = addCardErrorMessage(t, failure);

      /* It comes after Braintree has vaulted the card, so it gets its own error for callers
         that need to refresh their cards. */
      if (message && isCardAddedFailure(failure))
        throw new CardAddedPaymentError(message, { logDetail: backendMessage });

      /* Only customer-facing errors use PaymentUserError, which is what lets them reach the
         screen; anything else is an HTTP dump and stays opaque. */
      if (message)
        throw new PaymentUserError(message, { logDetail: backendMessage });

      throw new Error(`HTTP ${response.status}: ${backendMessage}`);
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedCard = SavedCardSchema.safeParse(transformedData);
    if (!parsedCard.success) {
      console.error('Failed to parse SavedCard response:', {
        data,
        error: parsedCard.error,
        transformedData,
      });
      throw new Error('Invalid response format from server');
    }
    return parsedCard.data.token;
  }
  catch (error: unknown) {
    console.error('Failed to add card:', error);
    // Rethrow as-is: re-wrapping would strip the PaymentUserError marker and subclass.
    throw error instanceof PaymentUserError
      ? error
      : new Error(error instanceof Error ? error.message : 'Failed to add card');
  }
}

export async function createCardNonce(payload: CreateCardNoncePayload): Promise<string> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/nonce/`, {
      body: JSON.stringify(convertKeys(payload, false, false)),
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(extractBackendError(errorText).message);
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = CreateCardNonceResponseSchema.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse CreateCardNonce response:', {
        data,
        error: parsedResponse.error,
        transformedData,
      });
      throw new Error('Invalid response format from server');
    }
    return parsedResponse.data.paymentNonce;
  }
  catch (error: any) {
    console.error('Failed to create card nonce:', error);
    throw new Error(caughtMessageOr(error, 'Failed to create card nonce'));
  }
}

export async function deleteCard(token: string): Promise<void> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      body: JSON.stringify({ payment_token: token }),
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(extractBackendError(errorText).message);
    }
  }
  catch (error: any) {
    console.error('Failed to delete card:', error);
    throw new Error(caughtMessageOr(error, 'Failed to delete card'));
  }
}

export async function getSavedCard(): Promise<SavedCard[]> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      const errorText = await response.text();
      throw new Error(extractBackendError(errorText).message);
    }

    const data = await response.json();
    const transformedData = convertKeys(data, true, false);
    const parsedResponse = SavedCardResponseSchema.safeParse(transformedData);
    if (!parsedResponse.success) {
      console.error('Failed to parse SavedCardResponse:', {
        data,
        error: parsedResponse.error,
        transformedData,
      });
      return [];
    }
    return parsedResponse.data.cards;
  }
  catch (error: any) {
    console.error('Failed to get saved card:', error);
    return [];
  }
}
