import type { ComposerTranslation } from 'vue-i18n';
import type { UserPayment } from '~/types/account';
import { toTitleCase } from '~/utils/text';

/**
 * `paidUsing` value of a card payment. The backend sends the `PaidVia` enum name
 * (`CREDIT_CARD`, `PAYPAL`, `CRYPTO`, `BANK_TRANSFER`).
 */
export const PAID_USING_CARD = 'CREDIT_CARD';

/**
 * Whether the payment history has a card payment that was not refunded.
 */
export function hasCardPaymentInHistory(payments: readonly Pick<UserPayment, 'paidUsing' | 'isRefund'>[]): boolean {
  return payments.some(p => p.paidUsing === PAID_USING_CARD && !p.isRefund);
}

/** The newest payment, refunds left out: those are not something the user paid. */
export function latestPayment<T extends Pick<UserPayment, 'paidAt' | 'isRefund'>>(payments: readonly T[]): T | undefined {
  return payments.reduce<T | undefined>((latest, payment) => {
    if (payment.isRefund)
      return latest;
    return !latest || Date.parse(payment.paidAt) > Date.parse(latest.paidAt) ? payment : latest;
  }, undefined);
}

/** Where a payment's invoice downloads from: legacy payments only have a receipt. */
export function invoiceUrl({ identifier, legacy }: Pick<UserPayment, 'identifier' | 'legacy'>): string {
  return legacy ? `/webapi/download/receipt/${identifier}/` : `/webapi/2/invoices/${identifier}/`;
}

/** The `PaidVia` name as a label; anything new falls back to a readable form of it. */
function methodName(t: ComposerTranslation, paidUsing: string): string {
  switch (paidUsing) {
    case PAID_USING_CARD:
      return t('common.card');
    case 'PAYPAL':
      return t('account.payments.methods.paypal');
    case 'CRYPTO':
      return t('account.payments.methods.crypto');
    case 'BANK_TRANSFER':
      return t('account.payments.methods.bank_transfer');
    default:
      return toTitleCase(paidUsing);
  }
}

/** How a payment was made, naming account credit when some of it went in. */
export function paymentMethodLabel(t: ComposerTranslation, { paidUsing, referralCreditAppliedEur }: Pick<UserPayment, 'paidUsing' | 'referralCreditAppliedEur'>): string {
  const method = methodName(t, paidUsing);
  return referralCreditAppliedEur > 0 ? t('account.payments.method_with_credit', { method }) : method;
}
