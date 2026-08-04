// User-facing copy for the card-payment SPA. This package has no i18n runtime
// (it ships a single locale), so strings live here rather than being scattered
// through components: one place to review the wording, and the same shape a
// translation layer would need if one is ever added.
//
// Keep in step with `subscription.error.*` in the website's
// `i18n/locales/en.json` — both render the same failures, and `payment` vs
// `card` mirrors the `PaymentErrorContext` split there. Nothing is being
// charged when a card is being saved, so the two must not share wording.

export const en = {
  payment: {
    networkFailure: 'We couldn\'t reach the payment provider. Check your connection and try again.',
    unexpectedFailure: 'We couldn\'t complete your payment. Please try again, or contact support if it keeps happening.',
    unexpectedFailureWithReference: (code: string): string =>
      `We couldn't complete your payment. Please try again, or contact support quoting reference ${code}.`,
  },
  card: {
    networkFailure: 'We couldn\'t reach the payment provider. Check your connection and try again.',
    unexpectedFailure: 'We couldn\'t save this card. Please try again, or contact support if it keeps happening.',
    unexpectedFailureWithReference: (code: string): string =>
      `We couldn't save this card. Please try again, or contact support quoting reference ${code}.`,
  },
} as const;
