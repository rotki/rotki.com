import { z } from 'zod';

/**
 * Shared account-related schemas for card-payment and website packages
 * These schemas represent the common data structures used across both applications
 */

export enum VatIdStatus {
  NOT_CHECKED = 'Not checked',
  VALID = 'Valid',
  NOT_VALID = 'Not valid',
  NON_EU_ID = 'ID outside the EU',
}

// Comprehensive address schema that supports both package needs
export const AddressSchema = z.object({
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

export type Address = z.infer<typeof AddressSchema>;

// Account schema - comprehensive to support both packages
export const AccountSchema = z.object({
  address: AddressSchema,
  apiKey: z.string(),
  apiSecret: z.string(),
  canUsePremium: z.boolean(),
  dateNow: z.string(),
  email: z.string().min(1),
  emailConfirmed: z.boolean(),
  hasActiveSubscription: z.boolean(),
  username: z.string().min(1),
  vat: z.number(),
  vatIdStatus: z.string(),
});

export type Account = z.infer<typeof AccountSchema>;

// Account response wrapper
export const AccountResponseSchema = z.object({
  message: z.string().optional(),
  result: AccountSchema.optional(),
});

export type AccountResponse = z.infer<typeof AccountResponseSchema>;
