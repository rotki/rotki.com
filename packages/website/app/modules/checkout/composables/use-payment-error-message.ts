import { type ParsedPaymentError, paymentErrorCopy } from '@rotki/sigil';

/**
 * What the buyer was doing when the error happened. Nothing is being charged
 * in the `card` flows: they save a card or re-authorise an existing one, so
 * "we couldn't complete your payment" would be both wrong and alarming.
 */
export type PaymentErrorContext = 'payment' | 'card';

interface UsePaymentErrorMessageReturn {
  userMessageFor: (parsed: ParsedPaymentError, context?: PaymentErrorContext) => string;
}

/**
 * Translate the copy `paymentErrorCopy` picked for a payment error.
 *
 * The decision, above all whether the SDK's own message may be rendered at
 * all, lives in sigil so the card-payment SPA reaches the same conclusion
 * through `userPaymentMessage`. This only supplies the words.
 */
export function usePaymentErrorMessage(): UsePaymentErrorMessageReturn {
  const { t } = useI18n({ useScope: 'global' });

  function cardMessage(copy: Exclude<ReturnType<typeof paymentErrorCopy>, { kind: 'verbatim' }>): string {
    if (copy.kind === 'network')
      return t('subscription.error.card.network_failure');

    return copy.code
      ? t('subscription.error.card.unexpected_failure_with_reference', { code: copy.code })
      : t('subscription.error.card.unexpected_failure');
  }

  function paymentMessage(copy: Exclude<ReturnType<typeof paymentErrorCopy>, { kind: 'verbatim' }>): string {
    if (copy.kind === 'network')
      return t('subscription.error.payment.network_failure');

    return copy.code
      ? t('subscription.error.payment.unexpected_failure_with_reference', { code: copy.code })
      : t('subscription.error.payment.unexpected_failure');
  }

  function userMessageFor(parsed: ParsedPaymentError, context: PaymentErrorContext = 'payment'): string {
    const copy = paymentErrorCopy(parsed);

    if (copy.kind === 'verbatim')
      return copy.message;

    return context === 'card' ? cardMessage(copy) : paymentMessage(copy);
  }

  return { userMessageFor };
}
