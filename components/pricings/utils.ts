import type { MappedPlan } from '~/components/pricings/type';
import type { AvailablePlan } from '~/types';

export function isMostPopularPlan(plan: MappedPlan | AvailablePlan) {
  return plan.isMostPopular;
}

export function isFreePlan(plan: { type: string }) {
  return plan.type === 'free';
}

export function isCustomPlan(plan: { type: string }) {
  return plan.type === 'custom';
}

export function getMostPopularPlanName(plans: AvailablePlan[]): string | undefined {
  if (!plans || plans.length === 0)
    return undefined;

  return plans.find(isMostPopularPlan)?.tierName;
}
