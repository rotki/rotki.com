import { z } from 'zod';

// Saved card schema
export const SavedCardSchema = z.object({
  expiresAt: z.string(),
  imageUrl: z.string(),
  last4: z.string(),
  linked: z.boolean(),
  token: z.string(),
});

export const SavedCardResponseSchema = z.object({
  cards: z.array(SavedCardSchema),
});

export const CreateCardNonceResponseSchema = z.object({
  paymentNonce: z.string(),
});

// Payment request schema
export const CardPaymentRequestSchema = z.object({
  discountCode: z.string().nullish(),
  paymentMethodNonce: z.string(),
  planId: z.number(),
  upgradeSubId: z.string().optional(),
});

// Payment response schema (alias of request schema)
export const CardPaymentResponseSchema = CardPaymentRequestSchema;

// API payload schemas
export const AddCardPayloadSchema = z.object({
  paymentMethodNonce: z.string(),
});

export const CreateCardNoncePayloadSchema = z.object({
  paymentToken: z.string(),
});

// Inferred types
export type SavedCard = z.infer<typeof SavedCardSchema>;

export type SavedCardResponse = z.infer<typeof SavedCardResponseSchema>;

export type CreateCardNonceResponse = z.infer<typeof CreateCardNonceResponseSchema>;

export type CardPaymentRequest = z.infer<typeof CardPaymentRequestSchema>;

export type CardPaymentResponse = z.infer<typeof CardPaymentResponseSchema>;

export type AddCardPayload = z.infer<typeof AddCardPayloadSchema>;

export type CreateCardNoncePayload = z.infer<typeof CreateCardNoncePayloadSchema>;
