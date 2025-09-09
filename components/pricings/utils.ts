import type { MappedPlan } from '~/components/pricings/type';
import type { AvailablePlan } from '~/types';
import { get } from '@vueuse/core';

export function isMostPopularPlan(plan: MappedPlan) {
  return plan.isMostPopular;
}

export function isFreePlan(plan: { type: string }) {
  return plan.type === 'free';
}

export function isCustomPlan(plan: { type: string }) {
  return plan.type === 'custom';
}

export function getMostPopularPlanName(availablePlans: Ref<AvailablePlan[]>): ComputedRef<string | undefined> {
  return computed(() => {
    const plans = get(availablePlans);
    if (!plans || plans.length === 0)
      return undefined;

    // Find the plan with the highest price
    let maxPrice = 0;
    let mostPopular: string | undefined;

    plans.forEach((plan) => {
      const price = Number.parseFloat(plan.monthlyPlan?.price || plan.yearlyPlan?.price || '0');
      if (price > maxPrice) {
        maxPrice = price;
        mostPopular = plan.tierName;
      }
    });

    return mostPopular;
  });
}
