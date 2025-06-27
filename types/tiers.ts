import { z } from 'zod';

export const PremiumTierPlan = z.object({
  id: z.number(),
  price: z.string(),
}).nullable();

export const PremiumTierInfo = z.object({
  limits: z.object({
    maxBackupSizeMb: z.number(),
  }),
  monthlyPlan: PremiumTierPlan,
  name: z.string(),
  yearlyPlan: PremiumTierPlan,
}).transform(data => ({
  ...data,
  isMostPopular: data.name === 'pelican', // TODO: get this from backend
}));

export type PremiumTierInfo = z.infer<typeof PremiumTierInfo>;

export const PremiumTiersInfo = z.array(PremiumTierInfo);

export type PremiumTiersInfo = z.infer<typeof PremiumTiersInfo>;

export enum PricingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
};
