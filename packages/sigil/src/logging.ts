// Server-side payment log endpoint contract. Both the website and the card-
// payment SPA POST to the same Go backend endpoint with the same shape; this
// module owns the request body type and the fire-and-forget POST helper so
// the two callers can never drift.

import type { CardType, CheckoutPaymentMethod, CheckoutStep } from './common';
import type { PaymentServerEvent } from './failures';
import { toSnakeCaseKeys } from './case';

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
 * Sigil adds a `timestamp` field automatically — callers don't need to.
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
    // Silently ignore — logging failures must never affect payment UX
  });
}
