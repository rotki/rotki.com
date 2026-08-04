import { parseBraintreeError, type ParsedPaymentError, paymentErrorCopy } from '@rotki/sigil';
import { en } from '@/i18n/en';

/**
 * Put words to the copy `paymentErrorCopy` picked for a payment error.
 *
 * The decision, above all whether the SDK's own message may be shown at all,
 * lives in sigil so the website reaches the same conclusion through
 * `usePaymentErrorMessage`. This only supplies the strings, which this package
 * carries literally because it ships a single locale and no i18n runtime.
 */
export function paymentMessageFor(parsed: ParsedPaymentError): string {
  const copy = paymentErrorCopy(parsed);

  if (copy.kind === 'verbatim')
    return copy.message;

  if (copy.kind === 'network')
    return en.payment.networkFailure;

  return copy.code
    ? en.payment.unexpectedFailureWithReference(copy.code)
    : en.payment.unexpectedFailure;
}

/** `paymentMessageFor` for callers holding a raw rejection and nothing to log. */
export function userPaymentMessage(error: unknown): string {
  return paymentMessageFor(parseBraintreeError(error));
}
