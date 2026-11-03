import type { Subscription } from '@rotki/card-payment-common/schemas/subscription';

export enum PaymentMethod {
  BLOCKCHAIN = 1,
  CARD = 2,
  PAYPAL = 3,
}

/** What the 3-D Secure dialog needs to verify a saved card for the active subscription. */
export interface CardVerificationData {
  cardToken: string;
  /** Identifies the card in the Braintree vault, which holds all of them. */
  cardLast4: string;
  /** Disambiguates two vault entries that share a last four. */
  cardExpiresAt: string;
  subscriptionData: Pick<Subscription, 'nextBillingAmount' | 'nextActionDate' | 'durationInMonths'>;
}
