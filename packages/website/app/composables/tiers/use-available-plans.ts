import type { ComputedRef, Ref } from 'vue';
import { type AvailablePlan, type AvailablePlans, type AvailablePlansResponse, AvailablePlansResponseSchema, type SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { until } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import tiersSnapshot from 'virtual:tiers-snapshot';
import { useTiersApi } from '~/composables/tiers/use-tiers-api';
import { TIER_NAMES } from '~/types/pricing';
import { PricingPeriod } from '~/types/tiers';
import { logger } from '~/utils/use-logger';

interface PlanDetails {
  planName: string;
  period: PricingPeriod;
  availablePlan: AvailablePlan;
}

interface UseAvailablePlansReturn {
  availablePlans: ComputedRef<AvailablePlans>;
  country: ComputedRef<string | undefined>;
  execute: () => Promise<void>;
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

/**
 * The plans the site was built with (production for rotki.com, staging otherwise), so
 * prerendered pages carry real prices and plan ids before the live request returns.
 */
function builtPlans(): AvailablePlansResponse {
  const parsed = AvailablePlansResponseSchema.safeParse(tiersSnapshot.availablePlans);
  return parsed.success ? parsed.data : defaultAvailablePlansData;
}

/**
 * Composable for fetching available plans
 * Uses useState to cache data and prevent duplicate fetches across components
 */
export function useAvailablePlans(): UseAvailablePlansReturn {
  const { fetchAvailablePlans } = useTiersApi();

  // useState persists across all component instances and contexts
  const availablePlansData = useState<AvailablePlansResponse>('available-plans-data', builtPlans);
  const pending = useState<boolean>('available-plans-pending', () => false);
  const fetched = useState<boolean>('available-plans-fetched', () => false);

  async function execute(): Promise<void> {
    if (get(fetched))
      return;

    // Already fetching, wait for it to complete
    if (get(pending)) {
      await until(pending).toBe(false);
      return;
    }

    set(pending, true);
    try {
      const response = await fetchAvailablePlans();
      // A failed request comes back with no tiers; keep the plans the site was built with
      if (response.tiers.length > 0)
        set(availablePlansData, response);
      set(fetched, true);
    }
    finally {
      set(pending, false);
    }
  }

  async function refresh(): Promise<void> {
    set(fetched, false);
    return execute();
  }

  const availablePlans = computed<AvailablePlans>(() => {
    const plans = get(availablePlansData)?.tiers ?? [];
    if (plans.length === 0)
      return plans;

    // `isMostPopular` is the existing highlight channel; here it marks the suggested Basic plan.
    return plans.map(plan => ({
      ...plan,
      isMostPopular: plan.tierName.toLowerCase() === TIER_NAMES.BASIC,
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

  // Auto-fetch on first use if not already fetched
  if (import.meta.client && !get(fetched) && !get(pending)) {
    execute().catch(logger.error.bind(logger, 'Failed to fetch available plans:'));
  }

  return {
    availablePlans,
    country,
    execute,
    getPlanDetailsFromId,
    getSelectedPlanFromId,
    pending,
    refresh,
  };
}
