/* eslint-disable camelcase */
import { z } from 'zod'

export interface ApiResponse<T> {
  readonly result: T | null
  readonly message: string
}

const StringArray = z.array(z.string())
export const ApiError = z.union([z.string(), z.record(StringArray)])

// eslint-disable-next-line no-redeclare
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

// eslint-disable-next-line no-redeclare
export type Address = z.infer<typeof Address>

export const Subscription = z.object({
  identifier: z.string().nonempty(),
  planName: z.string(),
  status: z.enum(['Active', 'Cancelled', 'Pending', 'Past Due'] as const),
  createdDate: z.string(),
  nextActionDate: z.string(),
  nextBillingAmount: z.string(),
  actions: StringArray,
})

// eslint-disable-next-line no-redeclare
export type Subscription = z.infer<typeof Subscription>

export const Payment = z.object({
  identifier: z.string().nonempty(),
  plan: z.string(),
  paidAt: z.string(),
  eurAmount: z.string(),
})

// eslint-disable-next-line no-redeclare
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

// eslint-disable-next-line no-redeclare
export type Account = z.infer<typeof Account>

export const ApiKeys = z.object({
  apiKey: z.string().nonempty(),
  apiSecret: z.string().nonempty(),
})

// eslint-disable-next-line no-redeclare
export type ApiKeys = z.infer<typeof ApiKeys>

export const ChangePasswordResponse = z.object({
  result: z.boolean().optional(),
  message: ApiError.optional(),
})

// eslint-disable-next-line no-redeclare
export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponse>

const UpdateProfile = z.object({
  address: Address,
  githubUsername: z.string(),
})

export const UpdateProfileResponse = z.object({
  result: UpdateProfile.optional(),
  message: ApiError.optional(),
})

// eslint-disable-next-line no-redeclare
export type UpdateProfileResponse = z.infer<typeof UpdateProfileResponse>

export const DeleteAccountResponse = z.object({
  result: z.boolean().optional(),
  message: z.string().optional(),
})

// eslint-disable-next-line no-redeclare
export type DeleteAccountResponse = z.infer<typeof DeleteAccountResponse>

export const CancelSubscriptionResponse = z.object({
  result: z.boolean().optional(),
  message: z.string().optional(),
})

// eslint-disable-next-line no-redeclare
export type CancelSubscriptionResponse = z.infer<
  typeof CancelSubscriptionResponse
>

const Plan = z.object({
  months: z.number(),
  priceFiat: z.string(),
  priceCrypto: z.string(),
  discount: z.number(),
})

// eslint-disable-next-line no-redeclare
export type Plan = z.infer<typeof Plan>

const PremiumData = z.object({
  plans: z.array(Plan),
})

// eslint-disable-next-line no-redeclare
export type PremiumData = z.infer<typeof PremiumData>

export const PremiumResponse = z.object({
  result: PremiumData,
})

// eslint-disable-next-line no-redeclare
export type PremiumResponse = z.infer<typeof PremiumResponse>

const SelectedPlan = z.object({
  dateNow: z.number(),
  vat: z.number(),
  priceInEur: z.string(),
  months: z.number(),
  finalPriceInEur: z.string(),
})

// eslint-disable-next-line no-redeclare
export type SelectedPlan = z.infer<typeof SelectedPlan>

const CardCheckout = z
  .object({
    braintreeClientToken: z.string(),
  })
  .merge(SelectedPlan)

// eslint-disable-next-line no-redeclare
export type CardCheckout = z.infer<typeof CardCheckout>

export const CardCheckoutResponse = z.object({
  result: CardCheckout,
})

// eslint-disable-next-line no-redeclare
export type CardCheckoutResponse = z.infer<typeof CardCheckoutResponse>
