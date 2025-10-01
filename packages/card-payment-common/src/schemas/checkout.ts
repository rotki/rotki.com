import { z } from 'zod';

export const CheckoutDataSchema = z.object({
  braintreeClientToken: z.string(),
  nextPayment: z.number().default(0),
});

export const CheckoutResponseSchema = z.object({
  result: CheckoutDataSchema,
});

// Inferred types
export type CheckoutData = z.infer<typeof CheckoutDataSchema>;

export type CheckoutResponse = z.infer<typeof CheckoutResponseSchema>;

export const UpgradeDataSchema = CheckoutDataSchema.extend({
  finalAmount: z.string(),
  fullAmount: z.string(),
});

export type UpgradeData = z.infer<typeof UpgradeDataSchema>;
