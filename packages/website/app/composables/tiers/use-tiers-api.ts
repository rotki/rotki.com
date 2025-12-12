import { type AvailablePlansResponse, AvailablePlansResponseSchema, type PriceBreakdown, PriceBreakdownSchema } from '@rotki/card-payment-common/schemas/plans';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type PremiumTiersInfo, PremiumTiersInfo as PremiumTiersInfoSchema } from '~/types/tiers';
import { logger } from '~/utils/use-logger';

export function useTiersApi() {
  const { fetchWithCsrf } = useFetchWithCsrf();
  const defaultAvailablePlans: AvailablePlansResponse = {
    settings: {
      isAuthenticated: false,
    },
    tiers: [],
  };
  const defaultPremiumTiersInfo: PremiumTiersInfo = [];

  async function fetchAvailablePlans(): Promise<AvailablePlansResponse> {
    try {
      const response = await fetchWithCsrf<AvailablePlansResponse>(
        '/webapi/2/available-tiers',
        { method: 'GET' },
      );
      const parsed = AvailablePlansResponseSchema.safeParse(response);
      if (!parsed.success) {
        logger.error('Failed to parse AvailablePlansResponse', {
          error: parsed.error,
          rawData: response,
        });
        return defaultAvailablePlans;
      }
      return parsed.data;
    }
    catch (error: any) {
      logger.error(`Failed to fetch available plans: ${error?.message ?? String(error)}`);
      return defaultAvailablePlans;
    }
  }

  async function fetchPremiumTiersInfo(): Promise<PremiumTiersInfo> {
    try {
      const response = await fetchWithCsrf<PremiumTiersInfo>(
        '/webapi/2/tiers/info',
      );
      const parsed = PremiumTiersInfoSchema.safeParse(response);
      if (!parsed.success) {
        logger.error('Failed to parse PremiumTiersInfo', {
          error: parsed.error,
          rawData: response,
        });
        return defaultPremiumTiersInfo;
      }
      return parsed.data;
    }
    catch (error: any) {
      logger.error(`Failed to fetch premium tiers info: ${error?.message ?? String(error)}`);
      return defaultPremiumTiersInfo;
    }
  }

  async function fetchPriceBreakdown(planId: number): Promise<PriceBreakdown | undefined> {
    try {
      const response = await fetchWithCsrf<PriceBreakdown>(
        `/webapi/2/plans/${planId}/price-breakdown`,
        { method: 'GET' },
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
  }

  return {
    fetchAvailablePlans,
    fetchPremiumTiersInfo,
    fetchPriceBreakdown,
  };
}
