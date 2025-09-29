import { z } from 'zod';

export const CheckoutDataSchema = z.object({
  braintreeClientToken: z.string(),
  nextPayment: z.number(),
});

export const CheckoutResponseSchema = z.object({
  result: CheckoutDataSchema,
});

// Inferred types
export type CheckoutData = z.infer<typeof CheckoutDataSchema>;

export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;
