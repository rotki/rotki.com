import type { Ref } from 'vue';
import { get, set, until } from '@vueuse/shared';
import tiersSnapshot from 'virtual:tiers-snapshot';
import { useTiersApi } from '~/composables/tiers/use-tiers-api';
import { PremiumTiersInfo } from '~/types/tiers';
import { logger } from '~/utils/use-logger';

interface UsePremiumTiersInfoReturn {
  execute: () => Promise<void>;
  pending: Ref<boolean>;
  tiersInformation: Ref<PremiumTiersInfo>;
}

const defaultTiersInfo: PremiumTiersInfo = [];

/**
 * The tier details the site was built with (production for rotki.com, staging otherwise),
 * so prerendered pages carry real prices and limits before the live request returns.
 */
export function builtTiersInfo(): PremiumTiersInfo {
  const parsed = PremiumTiersInfo.safeParse(tiersSnapshot.tiersInfo);
  return parsed.success ? parsed.data : defaultTiersInfo;
}

/**
 * Composable for fetching premium tiers info
 */
export function usePremiumTiersInfo(): UsePremiumTiersInfoReturn {
  const { fetchPremiumTiersInfo } = useTiersApi();

  const tiersInformation = useState<PremiumTiersInfo>('premium-tiers-info-data', builtTiersInfo);
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
      // A failed request comes back empty; keep the tier details the site was built with
      if (response.length > 0)
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
