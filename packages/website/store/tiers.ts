import { type AvailablePlan, type AvailablePlansResponse, AvailablePlansResponseSchema, type PriceBreakdown, PriceBreakdownSchema, type SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get, set } from '@vueuse/core';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { PremiumTiersInfo, PricingPeriod } from '~/types/tiers';

export const useTiersStore = defineStore('tiers', () => {
  const tiersInformation = ref<PremiumTiersInfo>([]);
  const availablePlansData = ref<AvailablePlansResponse>({
    settings: {
      isAuthenticated: false,
    },
    tiers: [],
  });

  const availablePlans = computed<AvailablePlansResponse['tiers']>(() => {
    const plans = get(availablePlansData).tiers;
    if (!plans || plans.length === 0)
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
  const country = computed(() => get(availablePlansData).settings?.country);

  const { fetchWithCsrf } = useFetchWithCsrf();

  const getAvailablePlans = async (): Promise<void> => {
    try {
      const response = await fetchWithCsrf<AvailablePlansResponse>(
        '/webapi/2/available-tiers',
        {
          method: 'GET',
        },
      );
      const data = AvailablePlansResponseSchema.parse(response);
      set(availablePlansData, data);
    }
    catch (error: any) {
      logger.error(error);
    }
  };

  const getPremiumTiersInfo = async (): Promise<void> => {
    if (get(tiersInformation).length > 0) {
      logger.debug('plans already loaded');
      return;
    }

    try {
      const response = await fetchWithCsrf<PremiumTiersInfo>(
        `/webapi/2/tiers/info`,
      );

      set(tiersInformation, PremiumTiersInfo.parse(response));
    }
    catch (error: any) {
      logger.error(`Failed to fetch premium tiers information: ${error.message}`);
    }
  };

  const getPlanDetailsFromId = (planId: number): { planName: string; period: PricingPeriod; availablePlan: AvailablePlan } | undefined => {
    const plans = get(availablePlans);

    for (const plan of plans) {
      if (plan.monthlyPlan?.planId === planId) {
        return {
          planName: plan.tierName,
          period: PricingPeriod.MONTHLY,
          availablePlan: plan,
        };
      }
      if (plan.yearlyPlan?.planId === planId) {
        return {
          planName: plan.tierName,
          period: PricingPeriod.YEARLY,
          availablePlan: plan,
        };
      }
    }

    return undefined;
  };

  const getSelectedPlanFromId = (planId: number): SelectedPlan | undefined => {
    const planDetails = getPlanDetailsFromId(planId);
    if (!planDetails) {
      return undefined;
    }

    const { availablePlan, period } = planDetails;
    const isMonthly = period === PricingPeriod.MONTHLY;
    const foundPlan = isMonthly ? availablePlan.monthlyPlan : availablePlan.yearlyPlan;

    if (!foundPlan) {
      return undefined;
    }

    return {
      durationInMonths: isMonthly ? 1 : 12,
      name: availablePlan.tierName,
      planId: foundPlan.planId,
      price: Number.parseFloat(foundPlan.price),
    };
  };

  const getPriceBreakdown = async (planId: number): Promise<PriceBreakdown | undefined> => {
    try {
      const response = await fetchWithCsrf<PriceBreakdown>(
        `/webapi/2/plans/${planId}/price-breakdown`,
        {
          method: 'GET',
        },
      );
      const parsed = PriceBreakdownSchema.safeParse(response);
      if (!parsed.success) {
        logger.error('Failed to parse PriceBreakdown:', {
          error: parsed.error,
          rawData: response,
        });
        return undefined;
      }
      return parsed.data;
    }
    catch (error: any) {
      logger.error(`Failed to fetch price breakdown: ${error.message}`);
      return undefined;
    }
  };

  return {
    availablePlans,
    availablePlansData,
    country,
    getAvailablePlans,
    getPlanDetailsFromId,
    getPriceBreakdown,
    getPremiumTiersInfo,
    getSelectedPlanFromId,
    tiersInformation,
  };
});
