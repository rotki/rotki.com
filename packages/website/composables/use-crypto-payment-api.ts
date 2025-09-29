import type { PaymentError } from '~/types/codes';
import { type ActionResultResponse, ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import {
  type CryptoPayment,
  CryptoPaymentResponse,
  type PendingCryptoPayment,
  PendingCryptoPaymentResponse,
  type Result,
} from '~/types';
import { createSimpleErrorResult, handlePaymentError } from '~/utils/api-error-handling';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

/**
 * Crypto payment API composable
 * Handles all crypto payment-related API operations
 */
export function useCryptoPaymentApi() {
  const logger = useLogger('crypto-payment-api');
  const { fetchWithCsrf } = useFetchWithCsrf();

  /**
   * Create crypto payment request
   */
  const cryptoPayment = async (
    plan: number,
    currencyId: string,
    subscriptionId?: string,
    discountCode?: string,
  ): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const response = await fetchWithCsrf<CryptoPaymentResponse>(
        '/webapi/2/crypto/payments',
        {
          body: convertKeys(
            {
              cryptocurrencyIdentifier: currencyId,
              planId: plan,
              subscriptionId,
              discountCode,
            },
            false,
            false,
          ),
          method: 'POST',
        },
      );

      const { result } = CryptoPaymentResponse.parse(response);
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
        '/webapi/2/crypto/payment/pending/',
        {
          params: convertKeys({ subscriptionId }, false, false),
        },
      );
      const data = PendingCryptoPaymentResponse.parse(response);
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
        'webapi/2/crypto/payment/pending/',
        {
          method: 'PATCH',
        },
      );
      const data = ActionResultResponseSchema.parse(response);
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
        'webapi/2/crypto/payment/pending/',
        {
          method: 'DELETE',
        },
      );
      const data = ActionResultResponseSchema.parse(response);
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
    discountCode?: string,
  ): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const data = await deletePendingPayment();
      if (!data.isError) {
        const payment = await cryptoPayment(plan, currency, subscriptionId, discountCode);
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
    checkPendingCryptoPayment,
    cryptoPayment,
    deletePendingPayment,
    markTransactionStarted,
    switchCryptoPlan,
  };
}
