import type { z } from 'zod';
import {
  type AvailablePlansResponse,
  AvailablePlansResponseSchema,
  type PaymentBreakdownRequest,
  type PaymentBreakdownResponse,
  PaymentBreakdownResponseSchema,
} from '@rotki/card-payment-common/schemas/plans';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { err, ok, type Result } from 'plainfp/result';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type PremiumTiersInfo, PremiumTiersInfo as PremiumTiersInfoSchema } from '~/types/tiers';
import { logger } from '~/utils/use-logger';

/** Reads a response into `schema`, logging a body that does not match or a request that throws. */
async function fetchParsed<T>(label: string, schema: z.ZodType<T>, request: () => Promise<unknown>): Promise<Result<T, unknown>> {
  try {
    const response = await request();
    const parsed = schema.safeParse(response);
    if (parsed.success)
      return ok(parsed.data);

    logger.error(`Failed to parse ${label}:`, { error: parsed.error, rawData: response });
    return err(parsed.error);
  }
  catch (error: unknown) {
    logger.error(`Failed to fetch ${label}:`, error);
    return err(error);
  }
}

export function useTiersApi() {
  const { fetchWithCsrf } = useFetchWithCsrf();

  async function fetchAvailablePlans(): Promise<Result<AvailablePlansResponse, unknown>> {
    return fetchParsed('available plans', AvailablePlansResponseSchema, async () => fetchWithCsrf<unknown>(
      '/webapi/2/available-tiers',
      { method: 'GET' },
    ));
  }

  async function fetchPremiumTiersInfo(): Promise<Result<PremiumTiersInfo, unknown>> {
    return fetchParsed('premium tiers info', PremiumTiersInfoSchema, async () => fetchWithCsrf<unknown>(
      '/webapi/2/tiers/info',
    ));
  }

  async function fetchPaymentBreakdown(params: PaymentBreakdownRequest): Promise<Result<PaymentBreakdownResponse, unknown>> {
    return fetchParsed('payment breakdown', PaymentBreakdownResponseSchema, async () => fetchWithCsrf<unknown>(
      '/webapi/2/payment/breakdown',
      {
        body: convertKeys(params, false, false),
        method: 'POST',
      },
    ));
  }

  return {
    fetchAvailablePlans,
    fetchPaymentBreakdown,
    fetchPremiumTiersInfo,
  };
}
