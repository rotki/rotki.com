import type { SelectedPlan } from '~/types';
import { get } from '@vueuse/core';
import { useTiersStore } from '~/store/tiers';
import { PricingPeriod } from '~/types/tiers';

export function useSelectedPlan() {
  const { plan: planParam } = usePlanParams();
  const { planId } = usePlanIdParam();

  const tiersStore = useTiersStore();
  const { availablePlans } = storeToRefs(tiersStore);
  const { getAvailablePlans } = tiersStore;

  const selectedPlan = computed<SelectedPlan | undefined>(() => {
    const planIdVal = get(planId);
    const planParamVal = get(planParam);

    if (!planIdVal || !planParamVal) {
      return undefined;
    }

    const item = get(availablePlans).find(item => item.subscriptionTierId === planIdVal);

    if (!item)
      return undefined;

    return {
      durationInMonths: planParamVal.period === PricingPeriod.MONTHLY ? 1 : 12,
      name: item.name,
      price: parseFloat(planParamVal.period === PricingPeriod.MONTHLY ? item.oneMonthTierConfig.basePrice : item.oneYearTierConfig.basePrice),
      subscriptionTierId: item.subscriptionTierId,
    };
  });

  onBeforeMount(async () => {
    await getAvailablePlans();
  });

  return {
    selectedPlan,
  };
}
