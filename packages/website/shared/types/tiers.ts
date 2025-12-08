import { z } from 'zod';

const PremiumTierPlan = z.object({
  id: z.number(),
  price: z.string(),
}).nullable();

export const PremiumTierInfoDescription = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

export type PremiumTierInfoDescription = z.infer<typeof PremiumTierInfoDescription>;

export const PremiumTierInfo = z.object({
  description: z.array(PremiumTierInfoDescription),
  limits: z.record(z.string(), z.union([z.boolean(), z.number()])),
  monthlyPlan: PremiumTierPlan,
  name: z.string(),
  yearlyPlan: PremiumTierPlan,
});

export type PremiumTierInfo = z.infer<typeof PremiumTierInfo>;

export const PremiumTiersInfo = z.array(PremiumTierInfo);

export type PremiumTiersInfo = z.infer<typeof PremiumTiersInfo>;

export enum PricingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
};
