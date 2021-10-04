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
