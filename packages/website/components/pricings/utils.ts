import type { MappedPlan } from '~/components/pricings/type';

export function isMostPopularPlan(plan: MappedPlan) {
  return plan.isMostPopular;
}

export function isFreePlan(plan: { type: string }) {
  return plan.type === 'free';
}

export function isCustomPlan(plan: { type: string }) {
  return plan.type === 'custom';
}
