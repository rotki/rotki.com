import { z } from 'zod';

export const PremiumTierInfo = z.object({
  limits: z.object({
    maxBackupSizeMb: z.number(),
  }),
  name: z.string(),
  oneMonthTierConfig: z.object({
    basePrice: z.string(),
  }),
  oneYearTierConfig: z.object({
    basePrice: z.string(),
  }),
});

export type PremiumTierInfo = z.infer<typeof PremiumTierInfo>;

export const PremiumTiersInfo = z.array(PremiumTierInfo);

export type PremiumTiersInfo = z.infer<typeof PremiumTiersInfo>;

export enum PricingPeriod {
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
};
