import { get, set } from '@vueuse/core';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store/index';
import { type AvailablePlan, AvailablePlans } from '~/types';
import { PremiumTiersInfo } from '~/types/tiers';

export const useTiersStore = defineStore('tiers', () => {
  const authenticatedOnPlansLoad = ref(false);
  const tiersInformation = ref<PremiumTiersInfo>([]);
  const availablePlans = ref<AvailablePlan[]>([]);

  const { authenticated } = storeToRefs(useMainStore());
  const { fetchWithCsrf } = useFetchWithCsrf();

  const getAvailablePlans = async (): Promise<void> => {
    if (get(availablePlans).length > 0 && get(authenticated) === get(authenticatedOnPlansLoad)) {
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
      set(authenticatedOnPlansLoad, get(authenticated));
    }
    catch (error: any) {
      logger.error(error);
    }
  };

  const getPremiumTiersInfo = async (): Promise<void> => {
    if (get(tiersInformation).length > 0 && get(authenticated) === get(authenticatedOnPlansLoad)) {
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
