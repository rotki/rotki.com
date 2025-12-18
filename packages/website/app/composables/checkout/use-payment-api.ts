import type { ActionResultResponse } from '@rotki/card-payment-common';
import type { Result } from '~/types';
import type { PaymentError } from '~/types/codes';
import {
  type CardPaymentRequest,
  CardPaymentResponseSchema,
} from '@rotki/card-payment-common/schemas/payment';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { handlePaymentError } from '~/utils/api-error-handling';
import { useLogger } from '~/utils/use-logger';

/**
 * Payment management API composable
 * Handles card payment-related API operations
 */
export function usePaymentApi() {
  const logger = useLogger('payment-api');
  const { fetchWithCsrf } = useFetchWithCsrf();

  /**
   * Process card payment
   */
  const pay = async ({ upgradeSubId, ...payload }: CardPaymentRequest): Promise<Result<true, PaymentError>> => {
    try {
      if (upgradeSubId) {
        const response = await fetchWithCsrf<ActionResultResponse>(
          '/webapi/2/braintree/upgrade',
          {
            body: {
              ...payload,
              subscriptionId: upgradeSubId,
            },
            method: 'POST',
          },
        );

        if (response.result) {
          return {
            isError: false,
            result: true,
          };
        }
        return {
          isError: true,
          error: new Error(response.message || 'Failed to upgrade payment'),
        };
      }

      const response = await fetchWithCsrf<CardPaymentRequest>(
        '/webapi/2/braintree/payments',
        {
          body: payload,
          method: 'POST',
        },
      );

      const parsed = CardPaymentResponseSchema.safeParse(response);
      if (!parsed.success) {
        logger.error('Failed to parse payment response:', {
          rawData: response,
          zodErrors: parsed.error.errors,
        });
        return {
          error: new Error('Invalid payment response format'),
          isError: true,
        };
      }
      return {
        isError: false,
        result: true,
      };
    }
    catch (error: any) {
      logger.error('Payment failed:', error);
      return handlePaymentError(error);
    }
  };

  return {
    pay,
  };
}
