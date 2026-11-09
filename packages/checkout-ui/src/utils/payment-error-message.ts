import type { CheckoutTranslate } from './translator';

/**
 * What the buyer was doing when the error happened. Nothing is charged while a card is being
 * saved or verified, so "we couldn't complete your payment" would be wrong and alarming there.
 */
export type PaymentErrorContext = 'payment' | 'card';

/** The decision of `paymentErrorCopy` in `@rotki/sigil`, which picks what may be shown. */
export type PaymentErrorDecision =
  | { kind: 'verbatim'; message: string }
  | { kind: 'network' }
  | { kind: 'unexpected'; code?: string };

/** Puts words to the copy picked for a payment error, the same in both apps. */
export function paymentErrorMessage(t: CheckoutTranslate, decision: PaymentErrorDecision, context: PaymentErrorContext = 'payment'): string {
  if (decision.kind === 'verbatim')
    return decision.message;
  if (decision.kind === 'network')
    return t('checkout.payment_error.network');

  const { code } = decision;
  if (context === 'card') {
    return code
      ? t('checkout.payment_error.card_with_reference', { code })
      : t('checkout.payment_error.card');
  }
  return code
    ? t('checkout.payment_error.payment_with_reference', { code })
    : t('checkout.payment_error.payment');
}
