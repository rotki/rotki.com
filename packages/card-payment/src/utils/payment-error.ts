import { parseBraintreeError, type ParsedPaymentError, paymentErrorCopy } from '@rotki/sigil';
import { en } from '@/i18n/en';

/**
 * What the buyer was doing when the error happened. Nothing is charged while a
 * card is being saved, so "we couldn't complete your payment" would be both
 * wrong and alarming there. Mirrors `PaymentErrorContext` on the website.
 */
export type PaymentErrorContext = 'payment' | 'card';

/**
 * Put words to the copy `paymentErrorCopy` picked for a payment error.
 *
 * The decision, above all whether the SDK's own message may be shown at all,
 * lives in sigil so the website reaches the same conclusion through
 * `usePaymentErrorMessage`. This only supplies the strings, which this package
 * carries literally because it ships a single locale and no i18n runtime.
 */
export function paymentMessageFor(parsed: ParsedPaymentError, context: PaymentErrorContext = 'payment'): string {
  const copy = paymentErrorCopy(parsed);

  if (copy.kind === 'verbatim')
    return copy.message;

  const strings = context === 'card' ? en.card : en.payment;

  if (copy.kind === 'network')
    return strings.networkFailure;

  return copy.code
    ? strings.unexpectedFailureWithReference(copy.code)
    : strings.unexpectedFailure;
}

/** `paymentMessageFor` for callers holding a raw rejection and nothing to log. */
export function userPaymentMessage(error: unknown, context: PaymentErrorContext = 'payment'): string {
  return paymentMessageFor(parseBraintreeError(error), context);
}
