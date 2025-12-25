import { z } from 'zod';

export const AvailablePlanSchema = z.object({
  isMostPopular: z.boolean().default(false),
  isCustom: z.boolean().default(false),
  monthlyPlan: z.object({
    planId: z.number(),
    price: z.string(),
  }).nullable(),
  tierName: z.string(),
  yearlyPlan: z.object({
    planId: z.number(),
    price: z.string(),
  }).nullable(),
});

export const AvailablePlansSchema = z.array(AvailablePlanSchema);

export const AvailablePlansResponseSchema = z.object({
  settings: z.object({
    country: z.string().nullish(),
    isAuthenticated: z.boolean().default(false),
  }),
  tiers: AvailablePlansSchema,
});

export const SelectedPlanSchema = z.object({
  planId: z.number(),
  name: z.string(),
  price: z.number(),
  durationInMonths: z.number(),
});

export const PriceBreakdownSchema = z.object({
  planId: z.number(),
  vatRate: z.string(),
  billingFrequencyMonths: z.number(),
  priceBreakdown: z.object({
    finalPrice: z.string(),
    basePrice: z.string(),
    vatAmount: z.string(),
  }),
  country: z.string(),
});

// Discount info schemas for payment breakdown response (discriminated union)
export const ValidPaymentBreakdownDiscountSchema = z.object({
  isValid: z.literal(true),
  isReferral: z.boolean(),
  discountType: z.string(),
  discountAmount: z.string(),
  discountedAmount: z.string(),
});

export const InvalidPaymentBreakdownDiscountSchema = z.object({
  isValid: z.literal(false),
  error: z.string(),
});

export const PaymentBreakdownDiscountSchema = z.discriminatedUnion('isValid', [
  ValidPaymentBreakdownDiscountSchema,
  InvalidPaymentBreakdownDiscountSchema,
]);

// New unified payment breakdown response schema (POST /payment/breakdown)
export const PaymentBreakdownResponseSchema = z.object({
  fullAmount: z.string(),
  finalAmount: z.string(),
  vatRate: z.string(),
  vatAmount: z.string(),
  renewingPrice: z.string(),
  braintreeClientToken: z.string().optional(), // Only for non-crypto payments
  nextPayment: z.number().default(0), // Next payment timestamp (for upgrades)
  discount: PaymentBreakdownDiscountSchema.nullable(),
});

// Request schema for type safety
export const PaymentBreakdownRequestSchema = z.object({
  newPlanId: z.number(),
  isCryptoPayment: z.boolean().optional().default(false),
  discountCode: z.string().nullish(),
});

// Inferred types
export type AvailablePlan = z.infer<typeof AvailablePlanSchema>;

export type AvailablePlans = z.infer<typeof AvailablePlansSchema>;

export type AvailablePlansResponse = z.infer<typeof AvailablePlansResponseSchema>;

export type SelectedPlan = z.infer<typeof SelectedPlanSchema>;

export type PriceBreakdown = z.infer<typeof PriceBreakdownSchema>;

export type ValidPaymentBreakdownDiscount = z.infer<typeof ValidPaymentBreakdownDiscountSchema>;

export type InvalidPaymentBreakdownDiscount = z.infer<typeof InvalidPaymentBreakdownDiscountSchema>;

export type PaymentBreakdownDiscount = z.infer<typeof PaymentBreakdownDiscountSchema>;

export type PaymentBreakdownResponse = z.infer<typeof PaymentBreakdownResponseSchema>;

export type PaymentBreakdownRequest = z.infer<typeof PaymentBreakdownRequestSchema>;
