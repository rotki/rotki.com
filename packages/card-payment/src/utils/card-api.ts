import {
  type AddCardPayload,
  type CreateCardNoncePayload,
  CreateCardNonceResponseSchema,
  type SavedCard,
  SavedCardResponseSchema,
  SavedCardSchema,
} from '@rotki/card-payment-common/schemas/payment';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { type CardType, type CheckoutStep, monthsToPlanDuration, type PaymentFailureKey, PaymentFailures, postPaymentLog, SigilEvents, sigilTrack, toSnakeCaseKeys } from '@rotki/sigil';
import { paths } from '@/config/paths';
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

function extractErrorMessage(errorText: string): string {
  try {
    const parsed = JSON.parse(errorText);
    if (parsed && typeof parsed.message === 'string')
      return parsed.message;
  }
  catch { /* JSON parse failed */ }
  return errorText;
}

export async function addCard(payload: AddCardPayload): Promise<string> {
  try {
    const response = await fetchWithCSRF(`${paths.hostUrlBase}/webapi/payment/btr/cards/`, {
      body: JSON.stringify(convertKeys(payload, false, false)),
      method: 'POST',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${extractErrorMessage(errorText)}`);
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
  catch (error: any) {
    console.error('Failed to add card:', error);
    throw new Error(error.message || 'Failed to add card');
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
      throw new Error(`HTTP ${response.status}: ${extractErrorMessage(errorText)}`);
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
    throw new Error(error.message || 'Failed to create card nonce');
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
      throw new Error(`HTTP ${response.status}: ${extractErrorMessage(errorText)}`);
    }
  }
  catch (error: any) {
    console.error('Failed to delete card:', error);
    throw new Error(error.message || 'Failed to delete card');
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
      throw new Error(`HTTP ${response.status}: ${extractErrorMessage(errorText)}`);
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
