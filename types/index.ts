import { z } from 'zod';

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

export type Address = z.infer<typeof Address>;

const SubStatus = z.enum([
  'Active',
  'Cancelled',
  'Cancelled but still active',
  'Pending',
  'Past Due',
] as const);

export type SubStatus = z.infer<typeof SubStatus>;

export const Subscription = z.object({
  actions: StringArray,
  createdDate: z.string(),
  durationInMonths: z.number().nonnegative(),
  identifier: z.string().nonempty(),
  nextActionDate: z.string(),
  nextBillingAmount: z.string(),
  pending: z.boolean().default(false),
  planName: z.string(),
  status: SubStatus,
});

export type Subscription = z.infer<typeof Subscription>;

export const Payment = z.object({
  eurAmount: z.string(),
  identifier: z.string().nonempty(),
  paidAt: z.string(),
  plan: z.string(),
});

export type Payment = z.infer<typeof Payment>;

export const Account = z.object({
  address: Address,
  apiKey: z.string(),
  apiSecret: z.string(),
  canUsePremium: z.boolean(),
  dateNow: z.string(),
  email: z.string().nonempty(),
  emailConfirmed: z.boolean(),
  hasActiveSubscription: z.boolean(),
  payments: z.array(Payment),
  subscriptions: z.array(Subscription),
  username: z.string().nonempty(),
  vat: z.number(),
});

export type Account = z.infer<typeof Account>;

export const ApiKeys = z.object({
  apiKey: z.string().nonempty(),
  apiSecret: z.string().nonempty(),
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

export type Plan = z.infer<typeof Plan>;

const PremiumData = z.object({
  plans: z.array(Plan),
});

export type PremiumData = z.infer<typeof PremiumData>;

export const PremiumResponse = z.object({
  result: PremiumData,
});

export type PremiumResponse = z.infer<typeof PremiumResponse>;

const SelectedPlan = z.object({
  finalPriceInEur: z.string(),
  months: z.number(),
  priceInEur: z.string(),
  startDate: z.number(),
  vat: z.number(),
});

export type SelectedPlan = z.infer<typeof SelectedPlan>;

const CardCheckout = z
  .object({
    braintreeClientToken: z.string(),
  })
  .merge(SelectedPlan);

export type CardCheckout = z.infer<typeof CardCheckout>;

export const CardCheckoutResponse = z.object({
  result: CardCheckout,
});

export type CardCheckoutResponse = z.infer<typeof CardCheckoutResponse>;

const CryptoPayment = z.object({
  chainId: z.number().optional(),
  chainName: z.string(),
  cryptoAddress: z.string(),
  cryptocurrency: z.string(),
  decimals: z.number().optional(),
  finalPriceInCrypto: z.string().nonempty(),
  finalPriceInEur: z.string().nonempty(),
  hoursForPayment: z.number(),
  iconUrl: z.string().optional(),
  months: z.number(),
  startDate: z.number(),
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
  pending: z.boolean(),
  transactionStarted: z.boolean().optional(),
});

export type PendingCryptoPayment = z.infer<typeof PendingCryptoPayment>;

export const PendingCryptoPaymentResponse = z.object({
  message: z.string().optional(),
  result: PendingCryptoPayment.optional(),
});

export type PendingCryptoPaymentResponse = z.infer<
  typeof PendingCryptoPaymentResponse
>;

export const PendingCryptoPaymentResultResponse = z.object({
  message: z.string().optional(),
  result: z.boolean().optional(),
});

export type PendingCryptoPaymentResultResponse = z.infer<
  typeof PendingCryptoPaymentResultResponse
>;

export interface CreateCardRequest {
  paymentMethodNonce: string;
}

export interface CardPaymentRequest extends CreateCardRequest {
  months: number;
}

interface Request {
  readonly method: string;
  readonly params: { [key: string]: any }[];
}

interface Caveat {
  readonly name: string;
  readonly value: string[];
}

interface Permission {
  readonly parentCapability: string;
  readonly caveats: Caveat[];
}

export interface Provider {
  readonly isMetaMask?: boolean;
  readonly request: (request: Request) => Promise<Permission[]>;
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
