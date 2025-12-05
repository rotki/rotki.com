import type { PaymentError } from '~/types/codes';
import { type ActionResultResponse, ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import {
  type CryptoPayment,
  CryptoPaymentResponse,
  type CryptoUpgradePayment,
  CryptoUpgradePaymentResponse,
  type CryptoUpgradeProrate,
  CryptoUpgradeProrateResponseSchema,
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

  const upgradeCryptoSubscription = async (planId: number, currency: string, subId: string): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const response = await fetchWithCsrf<CryptoPaymentResponse>(
        '/webapi/2/crypto/upgrade',
        {
          body: {
            cryptocurrencyIdentifier: currency,
            planId,
            subscriptionId: subId,
          },
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

  const prorateCryptoUpgrade = async (planId: number, subscriptionId: string): Promise<Result<CryptoUpgradeProrate, Error>> => {
    try {
      const response = await fetchWithCsrf<unknown>(
        '/webapi/2/crypto/upgrade/quote',
        {
          body: {
            planId,
            subscriptionId,
          },
          method: 'POST',
        },
      );

      const { result } = CryptoUpgradeProrateResponseSchema.parse(response);
      assert(result);

      return {
        result,
        isError: false,
      };
    }
    catch (error: unknown) {
      logger.error('Crypto payment quote request failed:', error);
      return {
        error: error instanceof Error ? error : new Error('Unknown error'),
        isError: true,
      };
    }
  };

  const checkCryptoUpgradePayment = async (
    subscriptionId?: string,
  ): Promise<Result<CryptoUpgradePayment>> => {
    try {
      const response = await fetchWithCsrf<CryptoUpgradePaymentResponse>(
        '/webapi/2/crypto/payment/upgrade/',
        {
          params: convertKeys({ subscriptionId }, false, false),
        },
      );
      const data = CryptoUpgradePaymentResponse.parse(response);
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
      logger.error(error);
      return {
        error,
        isError: true,
      };
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
  const markTransactionStarted = async (isUpgrade: boolean): Promise<Result<boolean>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        isUpgrade ? 'webapi/2/crypto/payment/upgrade/' : 'webapi/2/crypto/payment/pending/',
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

  const cancelUpgradeRequest = async (subscriptionId: string): Promise<Result<boolean>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>('webapi/2/crypto/upgrade/cancel', {
        body: {
          subscriptionId,
        },
        method: 'POST',
      });
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
      logger.error(error);
      return {
        error,
        isError: true,
      };
    }
  };

  return {
    checkPendingCryptoPayment,
    checkCryptoUpgradePayment,
    prorateCryptoUpgrade,
    cryptoPayment,
    deletePendingPayment,
    markTransactionStarted,
    switchCryptoPlan,
    cancelUpgradeRequest,
    upgradeCryptoSubscription,
  };
}
