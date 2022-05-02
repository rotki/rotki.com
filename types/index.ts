/* eslint-disable no-redeclare */
import { z } from 'zod'
import { supportedCurrencies } from '~/composables/plan'

type ResultError = {
  isError: true
  error: Error
}

type ResultSuccess<T> = {
  isError: false
  result: T
}

export type Result<T> = ResultError | ResultSuccess<T>

export interface ApiResponse<T> {
  readonly result: T | null
  readonly message: string
}

const StringArray = z.array(z.string())
export const ApiError = z.union([z.string(), z.record(StringArray)])

export type ApiError = z.infer<typeof ApiError>

export const Address = z.object({
  firstName: z.string(),
  lastName: z.string(),
  companyName: z.string(),
  address1: z.string(),
  address2: z.string(),
  city: z.string(),
  postcode: z.string(),
  country: z.string(),
  vatId: z.string(),
  movedOffline: z.boolean(),
})

export type Address = z.infer<typeof Address>

const SubStatus = z.enum([
  'Active',
  'Cancelled',
  'Pending',
  'Past Due',
] as const)
export type SubStatus = z.infer<typeof SubStatus>

export const Subscription = z.object({
  identifier: z.string().nonempty(),
  planName: z.string(),
  durationInMonths: z.number().nonnegative(),
  status: SubStatus,
  createdDate: z.string(),
  nextActionDate: z.string(),
  nextBillingAmount: z.string(),
  actions: StringArray,
})

export type Subscription = z.infer<typeof Subscription>

export const Payment = z.object({
  identifier: z.string().nonempty(),
  plan: z.string(),
  paidAt: z.string(),
  eurAmount: z.string(),
})

export type Payment = z.infer<typeof Payment>

export const Account = z.object({
  username: z.string().nonempty(),
  email: z.string().nonempty(),
  githubUsername: z.string(),
  apiKey: z.string(),
  apiSecret: z.string(),
  canUsePremium: z.boolean(),
  address: Address,
  vat: z.number(),
  hasActiveSubscription: z.boolean(),
  subscriptions: z.array(Subscription),
  payments: z.array(Payment),
  dateNow: z.string(),
})

export type Account = z.infer<typeof Account>

export const ApiKeys = z.object({
  apiKey: z.string().nonempty(),
  apiSecret: z.string().nonempty(),
})

export type ApiKeys = z.infer<typeof ApiKeys>

export const ChangePasswordResponse = z.object({
  result: z.boolean().optional(),
  message: ApiError.optional(),
})

export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponse>

const UpdateProfile = z.object({
  address: Address,
  githubUsername: z.string(),
})

export const UpdateProfileResponse = z.object({
  result: UpdateProfile.optional(),
  message: ApiError.optional(),
})

export type UpdateProfileResponse = z.infer<typeof UpdateProfileResponse>

export const DeleteAccountResponse = z.object({
  result: z.boolean().optional(),
  message: z.string().optional(),
})

export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponse>

export const CancelSubscriptionResponse = z.object({
  result: z.boolean().optional(),
  message: z.string().optional(),
})

export type CancelSubscriptionResponse = z.infer<
  typeof CancelSubscriptionResponse
>

const Plan = z.object({
  months: z.number(),
  priceFiat: z.string(),
  priceCrypto: z.string(),
  discount: z.number(),
})

export type Plan = z.infer<typeof Plan>

const PremiumData = z.object({
  plans: z.array(Plan),
})

export type PremiumData = z.infer<typeof PremiumData>

export const PremiumResponse = z.object({
  result: PremiumData,
})

export type PremiumResponse = z.infer<typeof PremiumResponse>

const SelectedPlan = z.object({
  startDate: z.number(),
  vat: z.number(),
  priceInEur: z.string(),
  months: z.number(),
  finalPriceInEur: z.string(),
})

export type SelectedPlan = z.infer<typeof SelectedPlan>

const CardCheckout = z
  .object({
    braintreeClientToken: z.string(),
  })
  .merge(SelectedPlan)

export type CardCheckout = z.infer<typeof CardCheckout>

export const CardCheckoutResponse = z.object({
  result: CardCheckout,
})

export type CardCheckoutResponse = z.infer<typeof CardCheckoutResponse>

const CryptoPayment = z.object({
  vat: z.number(),
  finalPriceInEur: z.string().nonempty(),
  cryptocurrency: z.enum(supportedCurrencies),
  finalPriceInCrypto: z.string().nonempty(),
  cryptoAddress: z.string(),
  tokenAddress: z.string().nullish(),
  startDate: z.number(),
  hoursForPayment: z.number(),
  months: z.number(),
  transactionStarted: z.boolean(),
})

export type CryptoPayment = z.infer<typeof CryptoPayment>

export const CryptoPaymentResponse = z.object({
  result: CryptoPayment.optional(),
  message: ApiError.optional(),
})

export type CryptoPaymentResponse = z.infer<typeof CryptoPaymentResponse>

const PendingCryptoPayment = z.object({
  pending: z.boolean(),
  transactionStarted: z.boolean().optional(),
  currency: z.enum(['ETH', 'BTC', 'DAI']).optional(),
})

export type PendingCryptoPayment = z.infer<typeof PendingCryptoPayment>

export const PendingCryptoPaymentResponse = z.object({
  result: PendingCryptoPayment.optional(),
  message: z.string().optional(),
})

export type PendingCryptoPaymentResponse = z.infer<
  typeof PendingCryptoPaymentResponse
>

export const PendingCryptoPaymentResultResponse = z.object({
  result: z.boolean().optional(),
  message: z.string().optional(),
})

export type PendingCryptoPaymentResultResponse = z.infer<
  typeof PendingCryptoPaymentResultResponse
>

export type CardPaymentRequest = {
  months: number
  paymentMethodNonce: string
}

interface Request {
  readonly method: string
  readonly params: { [key: string]: any }[]
}

interface Caveat {
  readonly name: string
  readonly value: string[]
}

interface Permission {
  readonly parentCapability: string
  readonly caveats: Caveat[]
}

export interface Provider {
  readonly isMetaMask?: boolean
  readonly request: (request: Request) => Promise<Permission[]>
}

export type StepType = 'pending' | 'failure' | 'success'
export type IdleStep = 'idle'
export type PaymentStep =
  | {
      type: StepType
      title: string
      message: string
      closeable?: boolean
    }
  | {
      type: IdleStep
    }
