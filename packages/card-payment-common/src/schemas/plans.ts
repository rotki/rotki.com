import { z } from 'zod';

export const AvailablePlanSchema = z.object({
  isMostPopular: z.boolean().default(false),
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

// Inferred types
export type AvailablePlan = z.infer<typeof AvailablePlanSchema>;

export type AvailablePlans = z.infer<typeof AvailablePlansSchema>;

export type AvailablePlansResponse = z.infer<typeof AvailablePlansResponseSchema>;

export type SelectedPlan = z.infer<typeof SelectedPlanSchema>;
