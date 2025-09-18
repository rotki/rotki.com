// Type definitions for the card payment app
import { z } from 'zod';

// API Response schemas based on main app
export const SavedCard = z.object({
  expiresAt: z.string(),
  imageUrl: z.string(),
  last4: z.string(),
  token: z.string(),
});

export const SavedCardResponse = z.object({
  cardDetails: SavedCard.optional(),
  message: z.string().optional(),
});

export const CreateCardNonceResponse = z.object({
  paymentNonce: z.string(),
});

// Account and Subscription schemas
export const Subscription = z.object({
  actions: z.array(z.string()),
  createdDate: z.string(),
  durationInMonths: z.number().nonnegative(),
  identifier: z.string().min(1),
  isSoftCanceled: z.boolean().default(false),
  nextActionDate: z.string(),
  nextBillingAmount: z.string(),
  paymentProvider: z.string().optional(),
  pending: z.boolean().default(false),
  planName: z.string(),
  status: z.enum(['Active', 'Cancelled', 'Cancelled but still active', 'Pending', 'Past Due']),
});

export const Address = z.object({
  address1: z.string(),
  address2: z.string(),
  city: z.string(),
  companyName: z.string(),
  country: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  movedOffline: z.boolean(),
  postcode: z.string(),
  vatId: z.string(),
  vatIdStatus: z.union([z.string(), z.number()]).transform(val => String(val)),
  vatStatusReason: z.string().nullable(),
});

export const Payment = z.object({
  eurAmount: z.string(),
  identifier: z.string(),
  isRefund: z.boolean().optional().default(false),
  paidAt: z.string(),
  plan: z.string(),
});

export const Account = z.object({
  address: Address,
  apiKey: z.string(),
  apiSecret: z.string(),
  canUsePremium: z.boolean(),
  dateNow: z.string(),
  email: z.string(),
  emailConfirmed: z.boolean(),
  hasActiveSubscription: z.boolean(),
  payments: z.array(Payment),
  subscriptions: z.array(Subscription),
  username: z.string(),
  vat: z.number(),
  vatIdStatus: z.string(),
});

export const AccountResponse = z.object({
  message: z.string().optional(),
  result: Account.optional(),
});

// Checkout schemas - Based on main project CardCheckout
export const CheckoutData = z.object({
  braintreeClientToken: z.string(),
  finalPriceInEur: z.string(),
  months: z.number(),
  priceInEur: z.string(),
  startDate: z.number(),
  vat: z.number(),
});

export const CheckoutResponse = z.object({
  result: CheckoutData,
});

// Type exports
export type SavedCardType = z.infer<typeof SavedCard>;

export type Account = z.infer<typeof Account>;

export type CheckoutData = z.infer<typeof CheckoutData>;

export type Subscription = z.infer<typeof Subscription>;

export type Address = z.infer<typeof Address>;

export type Payment = z.infer<typeof Payment>;

// Payment API interfaces
export interface AddCardPayload {
  paymentMethodNonce: string;
}

export interface CreateCardNoncePayload {
  paymentToken: string;
}

// Legacy interfaces (keeping for backward compatibility)
export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface BraintreeFieldError {
  field: string;
  type: string;
  message: string;
}

export interface HostedFieldsState {
  number: boolean;
  expirationDate: boolean;
  cvv: boolean;
}

export interface FieldValidation {
  number?: string;
  expirationDate?: string;
  cvv?: string;
}
