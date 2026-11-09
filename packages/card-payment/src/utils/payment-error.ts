import { checkoutMessages } from '@rotki/checkout-ui/messages/en';
import { type PaymentErrorContext, paymentErrorMessage } from '@rotki/checkout-ui/utils/payment-error-message';
import { createTranslator } from '@rotki/checkout-ui/utils/translator';
import { parseBraintreeError, type ParsedPaymentError, paymentErrorCopy } from '@rotki/sigil';

const t = createTranslator(checkoutMessages);

/**
 * Words for a payment error. Whether the SDK's own message may be shown at all is decided by
 * `paymentErrorCopy` in sigil, so both apps reach the same conclusion.
 */
export function paymentMessageFor(parsed: ParsedPaymentError, context: PaymentErrorContext = 'payment'): string {
  return paymentErrorMessage(t, paymentErrorCopy(parsed), context);
}

/** `paymentMessageFor` for callers holding a raw rejection and nothing to log. */
export function userPaymentMessage(error: unknown, context: PaymentErrorContext = 'payment'): string {
  return paymentMessageFor(parseBraintreeError(error), context);
}
