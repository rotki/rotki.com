import type { AvailablePlan } from '@rotki/card-payment-common';
import type { MappedPlan } from '~/components/pricings/type';
import { PricingPeriod } from '~/types/tiers';

export function isMostPopularPlan(plan: MappedPlan) {
  return plan.isMostPopular;
}

export function isFreePlan(plan: { type: string }) {
  return plan.type === 'free';
}

export function isCustomPlan(plan: { type: string }) {
  return plan.type === 'custom';
}

export function getPricingPeriod(durationInMonths: number | undefined): PricingPeriod {
  return durationInMonths === 12 ? PricingPeriod.YEARLY : PricingPeriod.MONTHLY;
}

export function getHighestPlanOnPeriod(plans: AvailablePlan[], durationInMonths: number): string | undefined {
  if (!plans || plans.length === 0)
    return undefined;

  const planKey = durationInMonths === 1 ? 'monthlyPlan' : 'yearlyPlan';

  const filteredPlans = plans.filter(plan => plan[planKey] !== null);
  if (filteredPlans.length === 0)
    return undefined;

  const highestPlan = filteredPlans.reduce((highest, current) => {
    const highestPrice = Number.parseFloat(highest[planKey]!.price);
    const currentPrice = Number.parseFloat(current[planKey]!.price);
    return currentPrice > highestPrice ? current : highest;
  });

  return highestPlan.tierName;
}
