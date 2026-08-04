import { type ParsedPaymentError, paymentErrorCopy } from '@rotki/sigil';

interface UsePaymentErrorMessageReturn {
  userMessageFor: (parsed: ParsedPaymentError) => string;
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

  function userMessageFor(parsed: ParsedPaymentError): string {
    const copy = paymentErrorCopy(parsed);

    if (copy.kind === 'verbatim')
      return copy.message;

    if (copy.kind === 'network')
      return t('subscription.error.network_failure');

    return copy.code
      ? t('subscription.error.unexpected_failure_with_reference', { code: copy.code })
      : t('subscription.error.unexpected_failure');
  }

  return { userMessageFor };
}
