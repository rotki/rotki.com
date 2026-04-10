import {
  type PaymentLogPayload,
  postPaymentLog,
  reasonForServerEvent,
  SigilEvents,
} from '@rotki/sigil';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';

/**
 * Fire-and-forget payment error logger.
 * Sends structured events to the backend for observability, and mirrors the
 * category into Sigil as a `payment_failed` event so the funnel is visible in
 * a single dashboard. Logging failures never affect the payment UX.
 */
export function usePaymentLogger(): {
  logPaymentEvent: (event: PaymentLogPayload) => void;
} {
  const { chronicle } = useSigilEvents();

  function logPaymentEvent(event: PaymentLogPayload): void {
    postPaymentLog(event);

    chronicle(SigilEvents.PAYMENT_FAILED, {
      paymentMethod: event.paymentMethod,
      reason: reasonForServerEvent(event.event),
      planId: event.planId,
      isUpgrade: event.isUpgrade ?? false,
      step: event.step,
      cardType: event.cardType,
      discountApplied: event.discountApplied,
    });
  }

  return { logPaymentEvent };
}
