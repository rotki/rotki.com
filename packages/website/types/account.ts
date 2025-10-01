import { DiscountType } from '@rotki/card-payment-common/schemas/discount';
import { z } from 'zod';

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
  lastSeenAt: z.string().datetime(),
  uniqueId: z.string(),
  user: z.string(),
});

export type UserDevice = z.infer<typeof UserDevice>;

export const UserDevices = z.array(UserDevice);

export type UserDevices = z.infer<typeof UserDevices>;

export const UserPayment = z.object({
  discount: z.object({
    amount: z.number().positive(),
    type: z.nativeEnum(DiscountType),
  }).optional(),
  durationInMonths: z.number().int().positive(),
  eurAmount: z.number().positive(),
  identifier: z.string().min(1),
  isRefund: z.boolean().default(false),
  isUpgrade: z.boolean().default(false),
  legacy: z.boolean(),
  originalPlan: z.string().nullish(),
  paidAt: z.string().datetime({ offset: true }),
  paidUsing: z.string(),
  plan: z.string(),
  priceBeforeDiscount: z.number().positive().optional(),
});

export type UserPayment = z.infer<typeof UserPayment>;

export const UserPayments = z.array(UserPayment);

export type UserPayments = z.infer<typeof UserPayments>;
