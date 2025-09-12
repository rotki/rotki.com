import { get, set } from '@vueuse/core';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type AvailablePlans, AvailablePlansResponse } from '~/types';
import { PremiumTiersInfo } from '~/types/tiers';

export const useTiersStore = defineStore('tiers', () => {
  const tiersInformation = ref<PremiumTiersInfo>([]);
  const availablePlansData = ref<AvailablePlansResponse>({
    settings: {
      isAuthenticated: false,
    },
    tiers: [],
  });

  const availablePlans = computed<AvailablePlans>(() => {
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
      const data = AvailablePlansResponse.parse(response);
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

  return {
    availablePlans,
    availablePlansData,
    country,
    getAvailablePlans,
    getPremiumTiersInfo,
    tiersInformation,
  };
});
