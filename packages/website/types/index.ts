import { AddressSchema } from '@rotki/card-payment-common/schemas/account';
import { DiscountType } from '@rotki/card-payment-common/schemas/discount';
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

const StringArray = z.array(z.string());

export const ApiError = z.union([z.string(), z.record(StringArray)]);

export type ApiError = z.infer<typeof ApiError>;

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
  address: AddressSchema,
});

export const UpdateProfileResponse = z.object({
  message: ApiError.optional(),
  result: UpdateProfile.optional(),
});

export type UpdateProfileResponse = z.infer<typeof UpdateProfileResponse>;

export const TaskResponse = z.object({
  taskId: z.string(),
});

export type TaskResponse = z.infer<typeof TaskResponse>;

export const TaskStatusResponse = z.object({
  error: z.string().optional(),
  result: z.boolean().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'failed']),
});

export type TaskStatusResponse = z.infer<typeof TaskStatusResponse>;

const CryptoPayment = z.object({
  chainId: z.number(),
  chainName: z.string(),
  cryptoAddress: z.string(),
  cryptocurrency: z.string(),
  decimals: z.number().optional(),
  durationInMonths: z.number(),
  finalPriceInCrypto: z.number(),
  finalPriceInEur: z.number(),
  firstPayment: z.boolean(),
  hoursForPayment: z.number(),
  iconUrl: z.string().optional(),
  months: z.number(),
  numberOfMonths: z.number(),
  startDate: z.number().nullable(),
  subscriptionId: z.string(),
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

const CryptoUpgradePayment = PendingCryptoPayment.extend({
  fromPlan: z.object({
    id: z.number(),
    tier: z.object({
      id: z.number(),
      name: z.string(),
    }),
  },
  ),
  toPlan: z.object({
    id: z.number(),
    tier: z.object({
      id: z.number(),
      name: z.string(),
    }),
  },
  ),
});

export type CryptoUpgradePayment = z.infer<typeof CryptoUpgradePayment>;

export const CryptoUpgradePaymentResponse = z.object({
  message: z.string().optional(),
  result: CryptoUpgradePayment.optional(),
});

export type CryptoUpgradePaymentResponse = z.infer<typeof CryptoUpgradePaymentResponse>;

export type StepType = 'pending' | 'failure' | 'success';

export type IdleStep = 'idle';

export interface PaymentStep {
  type: StepType | IdleStep;
  title?: string;
  message?: string;
  closeable?: boolean;
}

export const CHECKOUT_ROUTE_NAMES = [
  'checkout-pay',
  'checkout-pay-method',
  'checkout-pay-request-crypto',
  'checkout-pay-crypto',
  'checkout-pay-card',
  'checkout-pay-paypal',
  'checkout-pay-3d-secure',
] as const;

export type CheckoutRouteName = typeof CHECKOUT_ROUTE_NAMES[number];

export interface CheckoutStep {
  title: string;
  description: string;
  names: CheckoutRouteName[];
}

export interface CreateCardNonceRequest {
  paymentToken: string;
}

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
  isUpgrade: boolean;
}
