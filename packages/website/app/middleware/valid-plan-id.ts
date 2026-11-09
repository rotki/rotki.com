import { get } from '@vueuse/shared';
import { z } from 'zod';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { parseRouteParam } from '~/utils/query';

export default defineNuxtRouteMiddleware(async (to) => {
  const { availablePlans, execute } = useAvailablePlans();

  async function navigate(): Promise<ReturnType<typeof navigateTo>> {
    const { period, plan } = to.query;

    return navigateTo({
      name: 'checkout-pay',
      query: (period && plan) ? { period, plan } : {},
    });
  }

  // Get planId from the route query directly
  const currentPlanId = parseRouteParam(to.query.planId, z.coerce.number().int().positive());

  // If planId doesn't exist in route params, redirect to checkout
  if (!currentPlanId) {
    return navigate();
  }

  const planExists = (): boolean => get(availablePlans).some(plan => (plan.monthlyPlan?.planId === currentPlanId)
    || (plan.yearlyPlan?.planId === currentPlanId));

  // The plans start from the snapshot taken at build time, so only the live list can rule a plan out.
  if (!planExists())
    await execute();

  // If plan doesn't exist, redirect to checkout
  if (!planExists()) {
    return navigate();
  }
});
