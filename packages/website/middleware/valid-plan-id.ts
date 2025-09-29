import { get } from '@vueuse/core';
import { useTiersStore } from '~/store/tiers';

export default defineNuxtRouteMiddleware(async (to) => {
  const tiersStore = useTiersStore();
  const { availablePlans } = storeToRefs(tiersStore);

  const navigate = async () => {
    const { period, plan } = to.query;

    return navigateTo({
      name: 'checkout-pay',
      query: (period && plan) ? { period, plan } : {},
    });
  };

  // Get planId from the route query directly
  const currentPlanId = to.query.planId ? parseInt(to.query.planId as string) : undefined;

  // If planId doesn't exist in route params, redirect to checkout
  if (!currentPlanId) {
    return navigate();
  }

  // Ensure available plans are loaded
  if (get(availablePlans).length === 0) {
    await tiersStore.getAvailablePlans();
  }

  // Check if planId exists in any of the available plans
  const planExists = get(availablePlans).some(plan => (plan.monthlyPlan?.planId === currentPlanId)
    || (plan.yearlyPlan?.planId === currentPlanId));

  // If plan doesn't exist, redirect to checkout
  if (!planExists) {
    return navigate();
  }
});
