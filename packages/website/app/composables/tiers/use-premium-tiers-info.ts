import type { Ref } from 'vue';
import type { PremiumTiersInfo } from '~/types/tiers';
import { createSharedComposable } from '@vueuse/core';
import { useTiersApi } from '~/composables/tiers/use-tiers-api';

interface UsePremiumTiersInfoReturn {
  pending: Ref<boolean>;
  tiersInformation: Ref<PremiumTiersInfo>;
}

const defaultTiersInfo: PremiumTiersInfo = [];

function usePremiumTiersInfoInternal(): UsePremiumTiersInfoReturn {
  const { fetchPremiumTiersInfo } = useTiersApi();

  const { data: tiersInformation, pending } = useLazyAsyncData(
    'premium-tiers-info',
    fetchPremiumTiersInfo,
    {
      default: () => defaultTiersInfo,
      // Do not execute during SSR/prerender. Fetch on client after hydration.
      server: false,
    },
  );

  return {
    pending,
    tiersInformation,
  };
}

export const usePremiumTiersInfo = createSharedComposable(usePremiumTiersInfoInternal);
