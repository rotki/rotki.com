import type { Ref } from 'vue';
import type { PremiumTiersInfo } from '~/types/tiers';
import { get, set, until } from '@vueuse/shared';
import { useTiersApi } from '~/composables/tiers/use-tiers-api';
import { logger } from '~/utils/use-logger';

interface UsePremiumTiersInfoReturn {
  execute: () => Promise<void>;
  pending: Ref<boolean>;
  tiersInformation: Ref<PremiumTiersInfo>;
}

const defaultTiersInfo: PremiumTiersInfo = [];

/**
 * Composable for fetching premium tiers info
 */
export function usePremiumTiersInfo(): UsePremiumTiersInfoReturn {
  const { fetchPremiumTiersInfo } = useTiersApi();

  const tiersInformation = useState<PremiumTiersInfo>('premium-tiers-info-data', () => defaultTiersInfo);
  const pending = useState<boolean>('premium-tiers-info-pending', () => false);
  const fetched = useState<boolean>('premium-tiers-info-fetched', () => false);

  async function execute(): Promise<void> {
    if (get(fetched)) {
      return;
    }

    if (get(pending)) {
      await until(pending).toBe(false);
      return;
    }

    set(pending, true);
    try {
      const response = await fetchPremiumTiersInfo();
      set(tiersInformation, response);
      set(fetched, true);
    }
    finally {
      set(pending, false);
    }
  }

  if (import.meta.client && !get(fetched) && !get(pending)) {
    execute().catch(logger.error.bind(logger, 'Failed to fetch premium tiers info:'));
  }

  return {
    execute,
    pending,
    tiersInformation,
  };
}
