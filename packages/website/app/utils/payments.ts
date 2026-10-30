import type { UserPayment } from '~/types/account';

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

/** Where a payment's invoice downloads from: legacy payments only have a receipt. */
export function invoiceUrl({ identifier, legacy }: Pick<UserPayment, 'identifier' | 'legacy'>): string {
  return legacy ? `/webapi/download/receipt/${identifier}/` : `/webapi/2/invoices/${identifier}/`;
}
