import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/core';
import { useTiersStore } from '~/store/tiers';

export function useSelectedPlan() {
  const { planId } = usePlanIdParam();

  const tiersStore = useTiersStore();
  const { getAvailablePlans, getSelectedPlanFromId } = tiersStore;

  const selectedPlan = computed<SelectedPlan | undefined>(() => {
    const planIdVal = get(planId);

    if (!planIdVal) {
      return undefined;
    }

    return getSelectedPlanFromId(planIdVal);
  });

  onBeforeMount(async () => {
    await getAvailablePlans();
  });

  return {
    selectedPlan,
  };
}
