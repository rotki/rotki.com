import type { SelectedPlan } from '~/types';
import { get } from '@vueuse/core';
import { useTiersStore } from '~/store/tiers';
import { PricingPeriod } from '~/types/tiers';

export function useSelectedPlan() {
  const { planParams } = usePlanParams();
  const { planId } = usePlanIdParam();

  const tiersStore = useTiersStore();
  const { availablePlans } = storeToRefs(tiersStore);
  const { getAvailablePlans } = tiersStore;

  const selectedPlan = computed<SelectedPlan | undefined>(() => {
    const planIdVal = get(planId);
    const planParamVal = get(planParams);

    if (!planParamVal) {
      return undefined;
    }

    const tierPlan = get(availablePlans).find(item => item.tierName === planParamVal.plan);

    if (!tierPlan) {
      return undefined;
    }

    const period = planParamVal.period;
    const isMonthly = period === PricingPeriod.MONTHLY;
    const foundPlan = isMonthly ? tierPlan?.monthlyPlan : tierPlan?.yearlyPlan;

    if (!foundPlan || (typeof planIdVal !== 'undefined' && foundPlan.planId !== planIdVal)) {
      return undefined;
    }

    return {
      durationInMonths: isMonthly ? 1 : 12,
      name: tierPlan.tierName,
      planId: foundPlan.planId,
      price: parseFloat(foundPlan.price),
    };
  });

  onBeforeMount(async () => {
    await getAvailablePlans();
  });

  return {
    selectedPlan,
  };
}
