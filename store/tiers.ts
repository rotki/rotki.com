import { get, set } from '@vueuse/core';
import { type AvailablePlan, AvailablePlans } from '~/types';
import { PremiumTiersInfo } from '~/types/tiers';
import { fetchWithCsrf } from '~/utils/api';

export const useTiersStore = defineStore('tiers', () => {
  const tiersInformation = ref<PremiumTiersInfo>([]);
  const availablePlans = ref<AvailablePlan[]>([]);

  const getAvailablePlans = async (): Promise<void> => {
    if (get(availablePlans).length > 0) {
      logger.debug('plans already loaded');
      return;
    }

    try {
      const response = await fetchWithCsrf<AvailablePlans>(
        '/webapi/2/available-tiers',
        {
          method: 'GET',
        },
      );
      const data = AvailablePlans.parse(response);
      set(availablePlans, data);
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
    getAvailablePlans,
    getPremiumTiersInfo,
    tiersInformation,
  };
});
