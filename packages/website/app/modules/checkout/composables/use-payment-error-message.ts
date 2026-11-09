import { type PaymentErrorContext, paymentErrorMessage } from '@rotki/checkout-ui/utils/payment-error-message';
import { type ParsedPaymentError, paymentErrorCopy } from '@rotki/sigil';

interface UsePaymentErrorMessageReturn {
  userMessageFor: (parsed: ParsedPaymentError, context?: PaymentErrorContext) => string;
}

/**
 * Words for a payment error. Whether the SDK's own message may be shown at all is decided by
 * `paymentErrorCopy` in sigil, so both apps reach the same conclusion.
 */
export function usePaymentErrorMessage(): UsePaymentErrorMessageReturn {
  const { t } = useI18n({ useScope: 'global' });

  function userMessageFor(parsed: ParsedPaymentError, context: PaymentErrorContext = 'payment'): string {
    return paymentErrorMessage(t, paymentErrorCopy(parsed), context);
  }

  return { userMessageFor };
}
