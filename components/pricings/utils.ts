import type { MappedPlan } from '~/components/pricings/type';

export function isMostPopularPlan(plan: MappedPlan) {
  return plan.isMostPopular;
}

export function isFreePlan(plan: MappedPlan) {
  return plan.type === 'free';
}

export function isCustomPlan(plan: MappedPlan) {
  return plan.type === 'custom';
}
