import type { ActionResultResponse } from '@rotki/card-payment-common';
import type { Result } from '~/types';
import type { PaymentError } from '~/types/codes';
import { type CheckoutData as CardCheckout, CheckoutResponseSchema } from '@rotki/card-payment-common/schemas/checkout';
import {
  type CardPaymentRequest,
  type CardPaymentResponse,
  CardPaymentResponseSchema,
} from '@rotki/card-payment-common/schemas/payment';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { handlePaymentError } from '~/utils/api-error-handling';
import { useLogger } from '~/utils/use-logger';

/**
 * Payment management API composable
 * Handles card payment-related API operations including checkout and payments
 */
export function usePaymentApi() {
  const logger = useLogger('payment-api');
  const { fetchWithCsrf } = useFetchWithCsrf();

  /**
   * Create card payment checkout session
   */
  const checkout = async (plan: number): Promise<Result<CardCheckout>> => {
    try {
      const response = await fetchWithCsrf<CardPaymentResponse>(
        `/webapi/2/braintree/payments`,
        {
          method: 'PUT',
          body: {
            plan_id: plan,
          },
        },
      );
      const parsed = CheckoutResponseSchema.safeParse(response);
      if (!parsed.success) {
        logger.error('Failed to parse checkout response:', {
          rawData: response,
          zodErrors: parsed.error.errors,
        });
        return {
          error: new Error('Invalid checkout response format'),
          isError: true,
        };
      }
      const data = parsed.data;
      return {
        isError: false,
        result: data.result,
      };
    }
    catch (error: any) {
      logger.error('Failed to create checkout:', error);
      return {
        error,
        isError: true,
      };
    }
  };

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
    checkout,
    pay,
  };
}
