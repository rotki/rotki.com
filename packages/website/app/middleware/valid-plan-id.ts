import { get } from '@vueuse/core';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';

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
  const currentPlanId = to.query.planId ? Number.parseInt(to.query.planId as string) : undefined;

  // If planId doesn't exist in route params, redirect to checkout
  if (!currentPlanId) {
    return navigate();
  }

  // Ensure available plans are loaded (uses dedupe - won't re-fetch if pending/loaded)
  if (get(availablePlans).length === 0) {
    await execute();
  }

  // Check if planId exists in any of the available plans
  const planExists = get(availablePlans).some(plan => (plan.monthlyPlan?.planId === currentPlanId)
    || (plan.yearlyPlan?.planId === currentPlanId));

  // If plan doesn't exist, redirect to checkout
  if (!planExists) {
    return navigate();
  }
});
