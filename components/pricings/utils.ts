import type { CustomPlan, MappedPlan, StarterPlan } from '~/components/pricings/type';

export function isMostPopularPlan(plan: MappedPlan) {
  return 'isMostPopular' in plan && plan.isMostPopular;
}

export function isStarterPlan(plan: MappedPlan): plan is StarterPlan {
  return 'isStarter' in plan;
}

export function isCustomPlan(plan: MappedPlan): plan is CustomPlan {
  return 'isCustom' in plan;
}
