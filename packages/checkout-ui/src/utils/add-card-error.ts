import type { CheckoutTranslate } from './translator';

const CARD_ADD_FAILED_CODE = 'card_add_failed';

const SUPPORT_EMAIL = 'support@rotki.com';

export interface AddCardFailure {
  status?: number;
  /** The backend's error code. */
  code?: string;
  /** The backend's message; only read to choose the copy, as it can hold a raw gateway dump. */
  message?: string;
}

/** The backend failed after Braintree saved the card, so the buyer's card list changed. */
export function isCardAddedFailure({ status, code }: AddCardFailure): boolean {
  return status === 400 && code === CARD_ADD_FAILED_CODE;
}

/** Copy for a failed add-card request, or `undefined` for one that says nothing the buyer can use. */
export function addCardErrorMessage(t: CheckoutTranslate, failure: AddCardFailure): string | undefined {
  if (failure.status === 429) {
    return failure.message?.toLowerCase().includes('failed')
      ? t('checkout.add_card.rate_limited_failures')
      : t('checkout.add_card.rate_limited');
  }
  if (isCardAddedFailure(failure))
    return t('checkout.add_card.payment_method_failed', { email: SUPPORT_EMAIL });
  // These are schema errors or raw gateway dumps ("Do Not Honor"), which stay in the logs.
  if (failure.status === 400)
    return t('checkout.add_card.declined');
  return undefined;
}
