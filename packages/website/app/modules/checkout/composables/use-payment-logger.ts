import { logPaymentFailure, type PaymentLogPayload } from '@rotki/sigil';
import { useSigilEvents } from '~/composables/chronicling/use-sigil-events';

/** Reports payment failures to the backend log and the funnel. */
export function usePaymentLogger(): {
  logPaymentEvent: (event: PaymentLogPayload) => void;
} {
  const { chronicle } = useSigilEvents();

  function logPaymentEvent(event: PaymentLogPayload): void {
    logPaymentFailure(event, chronicle);
  }

  return { logPaymentEvent };
}
