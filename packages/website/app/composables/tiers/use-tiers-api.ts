import { type AvailablePlansResponse, AvailablePlansResponseSchema, type PriceBreakdown, PriceBreakdownSchema } from '@rotki/card-payment-common/schemas/plans';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type PremiumTiersInfo, PremiumTiersInfo as PremiumTiersInfoSchema } from '~/types/tiers';
import { logger } from '~/utils/use-logger';

export function useTiersApi() {
  const { fetchWithCsrf } = useFetchWithCsrf();

  async function fetchAvailablePlans(): Promise<AvailablePlansResponse> {
    const response = await fetchWithCsrf<AvailablePlansResponse>(
      '/webapi/2/available-tiers',
      { method: 'GET' },
    );
    return AvailablePlansResponseSchema.parse(response);
  }

  async function fetchPremiumTiersInfo(): Promise<PremiumTiersInfo> {
    const response = await fetchWithCsrf<PremiumTiersInfo>(
      '/webapi/2/tiers/info',
    );
    return PremiumTiersInfoSchema.parse(response);
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
