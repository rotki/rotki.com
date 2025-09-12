import type { PaymentError } from '~/types/codes';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import {
  ActionResultResponse,
  type CardCheckout,
  CardCheckoutResponse,
  type CardPaymentRequest,
  type CryptoPayment,
  CryptoPaymentResponse,
  type PendingCryptoPayment,
  PendingCryptoPaymentResponse,
  type Plan,
  PremiumResponse,
  type Result,
} from '~/types';
import { createSimpleErrorResult, handlePaymentError, logParseFailure } from '~/utils/api-error-handling';
import { assert } from '~/utils/assert';
import { convertKeys } from '~/utils/object';
import { useLogger } from '~/utils/use-logger';

/**
 * Payment management API composable
 * Handles all payment-related API operations including checkout, payments, and plan management
 */
export function usePaymentApi() {
  const logger = useLogger('payment-api');
  const { fetchWithCsrf } = useFetchWithCsrf();

  /**
   * Get available premium plans
   */
  const getPlans = async (): Promise<Plan[] | null> => {
    try {
      const response = await fetchWithCsrf<PremiumResponse>(
        '/webapi/premium/',
        {
          method: 'GET',
        },
      );
      const parsed = PremiumResponse.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'premium plans response', response, null);
      }
      return parsed.data.result.plans;
    }
    catch (error: any) {
      logger.error('Failed to fetch plans:', error);
      return null;
    }
  };

  /**
   * Create card payment checkout session
   */
  const checkout = async (plan: number): Promise<Result<CardCheckout>> => {
    try {
      const response = await fetchWithCsrf<CardCheckoutResponse>(
        `/webapi/checkout/card/${plan}/`,
        {
          method: 'GET',
        },
      );
      const parsed = CardCheckoutResponse.safeParse(response);
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
  const pay = async (request: CardPaymentRequest): Promise<Result<true, PaymentError>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        '/webapi/payment/btr/',
        {
          body: request,
          method: 'POST',
        },
      );

      const parsed = ActionResultResponse.safeParse(response);
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
      const data = parsed.data;
      assert(data.result);
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

  /**
   * Create crypto payment request
   */
  const cryptoPayment = async (
    plan: number,
    currencyId: string,
    subscriptionId?: string,
  ): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const response = await fetchWithCsrf<CryptoPaymentResponse>(
        '/webapi/payment/crypto/',
        {
          body: convertKeys(
            {
              currencyId,
              months: plan,
              subscriptionId,
            },
            false,
            false,
          ),
          method: 'POST',
        },
      );

      const parsed = CryptoPaymentResponse.safeParse(response);
      if (!parsed.success) {
        logger.error('Failed to parse crypto payment response:', {
          rawData: response,
          zodErrors: parsed.error.errors,
        });
        return {
          error: new Error('Invalid crypto payment response format'),
          isError: true,
        };
      }
      const { result } = parsed.data;
      assert(result);
      return {
        isError: false,
        result,
      };
    }
    catch (error: any) {
      logger.error('Crypto payment failed:', error);
      return handlePaymentError(error);
    }
  };

  /**
   * Check pending crypto payment status
   */
  const checkPendingCryptoPayment = async (
    subscriptionId?: string,
  ): Promise<Result<PendingCryptoPayment>> => {
    try {
      const response = await fetchWithCsrf<PendingCryptoPaymentResponse>(
        '/webapi/payment/pending/',
        {
          params: convertKeys({ subscriptionId }, false, false),
        },
      );
      const parsed = PendingCryptoPaymentResponse.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'pending crypto payment response', response, createSimpleErrorResult(new Error('Invalid response format')));
      }
      const data = parsed.data;
      if (data.result) {
        return {
          isError: false,
          result: data.result,
        };
      }
      return {
        error: new Error(data.message),
        isError: true,
      };
    }
    catch (error: any) {
      logger.error('Failed to check pending crypto payment:', error);
      return createSimpleErrorResult(error);
    }
  };

  /**
   * Mark crypto payment transaction as started
   */
  const markTransactionStarted = async (): Promise<Result<boolean>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        'webapi/payment/pending/',
        {
          method: 'PATCH',
        },
      );
      const parsed = ActionResultResponse.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'mark transaction response', response, createSimpleErrorResult(new Error('Invalid response format')));
      }
      const data = parsed.data;
      if (data.result) {
        return {
          isError: false,
          result: data.result,
        };
      }
      return {
        error: new Error(data.message),
        isError: true,
      };
    }
    catch (error: any) {
      logger.error('Failed to mark transaction as started:', error);
      return createSimpleErrorResult(error);
    }
  };

  /**
   * Delete pending crypto payment
   */
  const deletePendingPayment = async (): Promise<Result<boolean>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        'webapi/payment/pending/',
        {
          method: 'DELETE',
        },
      );
      const parsed = ActionResultResponse.safeParse(response);
      if (!parsed.success) {
        return logParseFailure(parsed, logger, 'delete pending payment response', response, createSimpleErrorResult(new Error('Invalid response format')));
      }
      const data = parsed.data;
      if (data.result) {
        return {
          isError: false,
          result: data.result,
        };
      }
      return {
        error: new Error(data.message),
        isError: true,
      };
    }
    catch (error: any) {
      logger.error('Failed to delete pending payment:', error);
      return createSimpleErrorResult(error);
    }
  };

  /**
   * Switch crypto payment plan (delete current and create new)
   */
  const switchCryptoPlan = async (
    plan: number,
    currency: string,
    subscriptionId?: string,
  ): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const data = await deletePendingPayment();
      if (!data.isError) {
        const payment = await cryptoPayment(plan, currency, subscriptionId);
        if (payment.isError) {
          return payment;
        }

        return {
          isError: false,
          result: payment.result,
        };
      }
      return createSimpleErrorResult(data.error);
    }
    catch (error: any) {
      logger.error('Failed to switch crypto plan:', error);
      return createSimpleErrorResult(error);
    }
  };

  return {
    checkout,
    checkPendingCryptoPayment,
    cryptoPayment,
    deletePendingPayment,
    getPlans,
    markTransactionStarted,
    pay,
    switchCryptoPlan,
  };
}
