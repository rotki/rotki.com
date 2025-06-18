import { z } from 'zod';
import { Address, PreTierSubscription } from '~/types/index';
import { DiscountType } from '~/types/payment';

export interface PasswordChangePayload {
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly passwordConfirmation: string;
}

export interface ProfilePayload {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly companyName?: string;
  readonly vatId?: string;
  readonly address1?: string;
  readonly address2?: string;
  readonly city?: string;
  readonly postcode?: string;
  readonly country?: string;
}

export interface DeleteAccountPayload {
  username: string;
}

export enum VatIdStatus {
  NOT_CHECKED = 'Not checked',
  VALID = 'Valid',
  NOT_VALID = 'Not valid',
  NON_EU_ID = 'ID outside the EU',
}

export const UserDevice = z.object({
  createdAt: z.string().datetime(),
  id: z.number(),
  label: z.string(),
  uniqueId: z.string(),
  user: z.string(),
});

export type UserDevice = z.infer<typeof UserDevice>;

export const UserDevices = z.array(UserDevice);

export type UserDevices = z.infer<typeof UserDevices>;

export const UserPayment = z.object({
  createdAt: z.string().datetime(),
  discount: z.object({
    amount: z.number().positive(),
    discountType: z.nativeEnum(DiscountType),
  }).nullable(),
  durationInMonths: z.number().int().positive(),
  finalPrice: z.number().positive(),
  identifier: z.string().min(1),
  isRefund: z.boolean().optional().default(false),
  paidUsing: z.string(),
  plan: z.string(),
  priceBeforeDiscount: z.number().positive(),
});

export type UserPayment = z.infer<typeof UserPayment>;

export const UserPayments = z.array(UserPayment);

export type UserPayments = z.infer<typeof UserPayments>;

export const PreTierPayment = z.object({
  eurAmount: z.string(),
  identifier: z.string().min(1),
  isRefund: z.boolean().optional().default(false),
  paidAt: z.string().datetime(),
  paidUsing: z.string(),
  plan: z.string(),
});

export type PreTierPayment = z.infer<typeof PreTierPayment>;

export const Account = z.object({
  address: Address,
  apiKey: z.string(),
  apiSecret: z.string(),
  canUsePremium: z.boolean(),
  dateNow: z.string(),
  email: z.string().min(1),
  emailConfirmed: z.boolean(),
  hasActiveSubscription: z.boolean(),
  payments: z.array(PreTierPayment),
  subscriptions: z.array(PreTierSubscription),
  username: z.string().min(1),
  vat: z.number(),
  vatIdStatus: z.string(),
});

export type Account = z.infer<typeof Account>;
