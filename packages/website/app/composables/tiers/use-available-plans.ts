import type { AvailablePlan, AvailablePlans, AvailablePlansResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { ComputedRef, Ref } from 'vue';
import { createSharedComposable, get } from '@vueuse/core';
import { useTiersApi } from '~/composables/tiers/use-tiers-api';
import { PricingPeriod } from '~/types/tiers';

interface PlanDetails {
  planName: string;
  period: PricingPeriod;
  availablePlan: AvailablePlan;
}

interface UseAvailablePlansReturn {
  availablePlans: ComputedRef<AvailablePlans>;
  country: ComputedRef<string | undefined>;
  getPlanDetailsFromId: (planId: number) => PlanDetails | undefined;
  getSelectedPlanFromId: (planId: number) => SelectedPlan | undefined;
  pending: Ref<boolean>;
  refresh: () => Promise<void>;
}

const defaultAvailablePlansData: AvailablePlansResponse = {
  settings: {
    isAuthenticated: false,
  },
  tiers: [],
};

function useAvailablePlansInternal(): UseAvailablePlansReturn {
  const { fetchAvailablePlans } = useTiersApi();

  const { data: availablePlansData, pending, refresh } = useLazyAsyncData(
    'available-plans',
    fetchAvailablePlans,
    { default: () => defaultAvailablePlansData },
  );

  const availablePlans = computed<AvailablePlans>(() => {
    const plans = get(availablePlansData)?.tiers ?? [];
    if (plans.length === 0)
      return plans;

    // Find the plan with the highest price to mark as most popular
    let maxPrice = 0;
    let mostPopularTierName: string | undefined;

    plans.forEach((plan) => {
      const price = Number.parseFloat(plan.monthlyPlan?.price || plan.yearlyPlan?.price || '0');
      if (price > maxPrice) {
        maxPrice = price;
        mostPopularTierName = plan.tierName;
      }
    });

    // Return plans with isMostPopular flag set
    return plans.map(plan => ({
      ...plan,
      isMostPopular: plan.tierName === mostPopularTierName,
    }));
  });

  const country = computed<string | undefined>(() => get(availablePlansData)?.settings?.country ?? undefined);

  function getPlanDetailsFromId(planId: number): PlanDetails | undefined {
    const plans = get(availablePlans);

    for (const plan of plans) {
      if (plan.monthlyPlan?.planId === planId) {
        return {
          availablePlan: plan,
          period: PricingPeriod.MONTHLY,
          planName: plan.tierName,
        };
      }
      if (plan.yearlyPlan?.planId === planId) {
        return {
          availablePlan: plan,
          period: PricingPeriod.YEARLY,
          planName: plan.tierName,
        };
      }
    }

    return undefined;
  }

  function getSelectedPlanFromId(planId: number): SelectedPlan | undefined {
    const planDetails = getPlanDetailsFromId(planId);
    if (!planDetails)
      return undefined;

    const { availablePlan, period } = planDetails;
    const isMonthly = period === PricingPeriod.MONTHLY;
    const foundPlan = isMonthly ? availablePlan.monthlyPlan : availablePlan.yearlyPlan;

    if (!foundPlan)
      return undefined;

    return {
      durationInMonths: isMonthly ? 1 : 12,
      name: availablePlan.tierName,
      planId: foundPlan.planId,
      price: Number.parseFloat(foundPlan.price),
    };
  }

  return {
    availablePlans,
    country,
    getPlanDetailsFromId,
    getSelectedPlanFromId,
    pending,
    refresh,
  };
}

export const useAvailablePlans = createSharedComposable(useAvailablePlansInternal);
