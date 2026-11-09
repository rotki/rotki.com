/* Server-side payment log endpoint contract. Both the website and the card-payment
   SPA POST to the same Go backend endpoint with the same shape; this module owns
   the request body type and the fire-and-forget POST helper so the two callers
   can never drift. */

import type { CardType, CheckoutPaymentMethod, CheckoutStep } from './common';
import { toSnakeCaseKeys } from './case';
import { SigilEvents } from './events';
import { type PaymentServerEvent, reasonForServerEvent } from './failures';

export const PAYMENT_LOG_ENDPOINT = '/api/logging/payment';

export interface PaymentLogPayload {
  paymentMethod: CheckoutPaymentMethod;
  event: PaymentServerEvent;
  errorMessage: string;
  errorCode?: string;
  planId?: number;
  step?: CheckoutStep;
  isUpgrade?: boolean;
  cardType?: CardType;
  discountApplied?: boolean;
}

/**
 * Fire-and-forget POST to the payment-log endpoint. Same-origin, no auth or
 * CSRF required, fail-silent so logging can never affect payment UX. The
 * `keepalive` flag lets the request survive a navigation away from the page,
 * which matters when an error happens in the middle of a redirect.
 *
 * Sigil adds a `timestamp` field automatically, so callers don't need to.
 * Keys are converted from camelCase to snake_case before sending.
 */
export function postPaymentLog(payload: PaymentLogPayload): void {
  if (typeof fetch === 'undefined')
    return;

  fetch(PAYMENT_LOG_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...toSnakeCaseKeys(payload), timestamp: Date.now() }),
    keepalive: true,
  }).catch(() => {
    // Silently ignore: logging failures must never affect payment UX
  });
}

/** What a payment failure tells the funnel, in the app's own way of sending events. */
export type PaymentFailedTracker = (event: typeof SigilEvents.PAYMENT_FAILED, payload: {
  paymentMethod: CheckoutPaymentMethod;
  reason: ReturnType<typeof reasonForServerEvent>;
  planId?: number;
  isUpgrade: boolean;
  step?: CheckoutStep;
  cardType?: CardType;
  discountApplied?: boolean;
}) => void;

/**
 * Reports a payment failure to the backend log and mirrors its category into the funnel, so both
 * apps send the same thing. Fire and forget: logging failures never affect the payment.
 */
export function logPaymentFailure(event: PaymentLogPayload, track: PaymentFailedTracker): void {
  postPaymentLog(event);
  track(SigilEvents.PAYMENT_FAILED, {
    paymentMethod: event.paymentMethod,
    reason: reasonForServerEvent(event.event),
    planId: event.planId,
    isUpgrade: event.isUpgrade ?? false,
    step: event.step,
    cardType: event.cardType,
    discountApplied: event.discountApplied,
  });
}
