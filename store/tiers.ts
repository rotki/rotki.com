import { get, set } from '@vueuse/core';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { AvailablePlansResponse } from '~/types';
import { PremiumTiersInfo } from '~/types/tiers';

export const useTiersStore = defineStore('tiers', () => {
  const tiersInformation = ref<PremiumTiersInfo>([]);
  const availablePlansData = ref<AvailablePlansResponse>({
    settings: {
      isAuthenticated: false,
    },
    tiers: [],
  });

  const availablePlans = computed(() => get(availablePlansData).tiers);
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
