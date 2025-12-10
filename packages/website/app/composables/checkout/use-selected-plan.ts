import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/core';
import { usePlanIdParam } from '~/composables/checkout/use-plan-params';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';

export function useSelectedPlan() {
  const { planId } = usePlanIdParam();
  const { getSelectedPlanFromId } = useAvailablePlans();

  const selectedPlan = computed<SelectedPlan | undefined>(() => {
    const planIdVal = get(planId);

    if (!planIdVal) {
      return undefined;
    }

    return getSelectedPlanFromId(planIdVal);
  });

  return {
    selectedPlan,
  };
}
