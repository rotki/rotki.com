import { z } from 'zod';
import { DiscountType } from '~/types/payment';

interface ResultError<Code = undefined> {
  isError: true;
  error: Error;
  code?: Code;
}

interface ResultSuccess<T> {
  isError: false;
  result: T;
}

export type Result<T, Code = undefined> = ResultError<Code> | ResultSuccess<T>;

export interface ApiResponse<T, M = string> {
  readonly result: T | null;
  readonly message: M;
}

const StringArray = z.array(z.string());

export const ApiError = z.union([z.string(), z.record(StringArray)]);

export type ApiError = z.infer<typeof ApiError>;

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
});

const SubscriptionStatus = z.enum([
  'Active',
  'Cancelled',
  'Cancelled but still active',
  'Pending',
  'Past Due',
] as const);

export const UserSubscription = z.object({
  actions: StringArray,
  createdDate: z.string().datetime({ offset: true }),
  durationInMonths: z.number().nonnegative(),
  id: z.number().or(z.string()).transform(String),
  isActive: z.boolean(),
  isLegacy: z.boolean(),
  isSoftCanceled: z.boolean().default(false),
  nextActionDate: z.string(),
  nextBillingAmount: z.number(),
  paymentProvider: z.string(),
  pending: z.boolean().default(false),
  planName: z.string(),
  status: SubscriptionStatus,
});

export type UserSubscription = z.infer<typeof UserSubscription>;

export const UserSubscriptions = z.array(UserSubscription);

export type UserSubscriptions = z.infer<typeof UserSubscriptions>;

export const ApiKeys = z.object({
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
});

export type ApiKeys = z.infer<typeof ApiKeys>;

export const ChangePasswordResponse = z.object({
  message: ApiError.optional(),
  result: z.boolean().optional(),
});

export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponse>;

const UpdateProfile = z.object({
  address: Address,
});

export const UpdateProfileResponse = z.object({
  message: ApiError.optional(),
  result: UpdateProfile.optional(),
});

export type UpdateProfileResponse = z.infer<typeof UpdateProfileResponse>;

export const ActionResultResponse = z.object({
  message: z.string().optional(),
  result: z.boolean().optional(),
});

export type ActionResultResponse = z.infer<typeof ActionResultResponse>;

const Plan = z.object({
  discount: z.number(),
  months: z.number(),
  priceCrypto: z.string(),
  priceFiat: z.string(),
});

export const AvailablePlan = z.object({
  isMostPopular: z.boolean().default(false),
  monthlyPlan: z.object({
    planId: z.number(),
    price: z.string(),
  }).nullable(),
  tierName: z.string(),
  yearlyPlan: z.object({
    planId: z.number(),
    price: z.string(),
  }).nullable(),
}).transform(data => ({
  ...data,
  isMostPopular: data.tierName === 'pelican', // TODO: get this from backend
}));

export type AvailablePlan = z.infer<typeof AvailablePlan>;

export const AvailablePlans = z.array(AvailablePlan);

export type AvailablePlans = z.infer<typeof AvailablePlans>;

const PremiumData = z.object({
  plans: z.array(Plan),
});

export const PremiumResponse = z.object({
  result: PremiumData,
});

export type PremiumResponse = z.infer<typeof PremiumResponse>;

export interface SelectedPlan {
  planId: number;
  name: string;
  price: number;
  durationInMonths: number;
}

const CardCheckout = z
  .object({
    braintreeClientToken: z.string(),
    nextPayment: z.number(),
  });

export type CardCheckout = z.infer<typeof CardCheckout>;

export const CardCheckoutResponse = z.object({
  result: CardCheckout,
});

export type CardCheckoutResponse = z.infer<typeof CardCheckoutResponse>;

const CryptoPayment = z.object({
  chainId: z.number(),
  chainName: z.string(),
  cryptoAddress: z.string(),
  cryptocurrency: z.string(),
  decimals: z.number().optional(),
  finalPriceInCrypto: z.number(),
  finalPriceInEur: z.number(),
  firstPayment: z.boolean(),
  hoursForPayment: z.number(),
  iconUrl: z.string().optional(),
  months: z.number(),
  numberOfMonths: z.number(),
  startDate: z.number().nullable(),
  subscriptionId: z.number(),
  tokenAddress: z.string().nullish(),
  transactionStarted: z.boolean(),
  vat: z.number(),
});

export type CryptoPayment = z.infer<typeof CryptoPayment>;

export const CryptoPaymentResponse = z.object({
  message: ApiError.optional(),
  result: CryptoPayment.optional(),
});

export type CryptoPaymentResponse = z.infer<typeof CryptoPaymentResponse>;

const PendingCryptoPayment = z.object({
  currency: z.string().optional(),
  discount: z.object({
    codeName: z.string(),
    discountedAmountEur: z.string(),
    discountType: z.nativeEnum(DiscountType),
  }).optional(),
  pending: z.boolean(),
  transactionStarted: z.boolean().optional(),
});

export type PendingCryptoPayment = z.infer<typeof PendingCryptoPayment>;

export const PendingCryptoPaymentResponse = z.object({
  message: z.string().optional(),
  result: PendingCryptoPayment.optional(),
});

export type PendingCryptoPaymentResponse = z.infer<typeof PendingCryptoPaymentResponse>;

z.object({
  message: z.string().optional(),
  result: z.boolean().optional(),
});

export interface CreateCardRequest {
  paymentMethodNonce: string;
}

export interface CardPaymentRequest extends CreateCardRequest {
  planId: number;
  discountCode?: string;
}

export type StepType = 'pending' | 'failure' | 'success';

export type IdleStep = 'idle';

export interface PaymentStep {
  type: StepType | IdleStep;
  title?: string;
  message?: string;
  closeable?: boolean;
}

export const SavedCard = z.object({
  expiresAt: z.string(),
  imageUrl: z.string(),
  last4: z.string(),
  token: z.string(),
});

export type SavedCard = z.infer<typeof SavedCard>;

export const SavedCardResponse = z.object({
  cardDetails: SavedCard.optional(),
  message: z.string().optional(),
});

export type SavedCardResponse = z.infer<typeof SavedCardResponse>;

export interface CreateCardNonceRequest {
  paymentToken: string;
}

export const CreateCardNonceResponse = z.object({
  paymentNonce: z.string(),
});

export type CreateCardNonceResponse = z.infer<typeof CreateCardNonceResponse>;

export const PaymentAsset = z.object({
  address: z.string().optional(),
  iconUrl: z.string().optional(),
  isNativeCurrency: z.literal(true).optional(),
  name: z.string(),
  symbol: z.string(),
});

export const PaymentAssetResponse = z.record(z.record(PaymentAsset));

export type PaymentAssetResponse = z.infer<typeof PaymentAssetResponse>;

export interface VaultPaypalRequest {
  paymentMethodNonce: string;
}

export interface CreatePaypalNonceRequest {
  paymentToken: string;
}

export const SavedPaypalAccount = z.object({
  email: z.string(),
  imageUrl: z.string(),
  token: z.string(),
});

export type SavedPaypalAccount = z.infer<typeof SavedPaypalAccount>;

export const SavedPaypalResponse = z.object({
  message: z.string().optional(),
  paypalDetails: SavedPaypalAccount.optional(),
});

export type SavedPaypalResponse = z.infer<typeof SavedPaypalResponse>;

export const CreatePaypalNonceResponse = z.object({
  paymentNonce: z.string(),
});

export type CreatePaypalNonceResponse = z.infer<typeof CreatePaypalNonceResponse>;

export const ResendVerificationResponse = z.object({
  allowedIn: z.number().optional(),
  message: z.string().optional(),
  result: z.literal(true).optional(),
});

export type ResendVerificationResponse = z.infer<typeof ResendVerificationResponse>;

export interface PendingTx {
  hash: string;
  subscriptionId: string;
  chainId: number;
  blockExplorerUrl: string;
}
