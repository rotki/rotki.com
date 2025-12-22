import type { PaymentError } from '~/types/codes';
import { type ActionResultResponse, ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { convertKeys } from '@rotki/card-payment-common/utils/object';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import {
  type CryptoPayment,
  CryptoPaymentResponse,
  type CryptoUpgradePayment,
  CryptoUpgradePaymentResponse,
  type PendingCryptoPayment,
  PendingCryptoPaymentResponse,
  type Result,
} from '~/types';
import { createSimpleErrorResult, handlePaymentError } from '~/utils/api-error-handling';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

/**
 * Parameters for crypto payment (purchase/renewal)
 */
export interface CryptoPaymentParams {
  planId: number;
  cryptocurrencyIdentifier: string;
  subscriptionId?: string;
  discountCode?: string;
}

/**
 * Parameters for crypto upgrade payment
 */
export interface CryptoUpgradePaymentParams {
  planId: number;
  cryptocurrencyIdentifier: string;
  subscriptionId: string;
  discountCode?: string;
}

interface UseCryptoPaymentApiReturn {
  checkPendingCryptoPayment: (subscriptionId?: string) => Promise<Result<PendingCryptoPayment>>;
  checkCryptoUpgradePayment: (subscriptionId?: string) => Promise<Result<CryptoUpgradePayment>>;
  cryptoPayment: (params: CryptoPaymentParams) => Promise<Result<CryptoPayment, PaymentError>>;
  deletePendingPayment: () => Promise<Result<boolean>>;
  markTransactionStarted: (isUpgrade: boolean) => Promise<Result<boolean>>;
  switchCryptoPlan: (params: CryptoPaymentParams) => Promise<Result<CryptoPayment, PaymentError>>;
  switchCryptoUpgradePlan: (params: CryptoUpgradePaymentParams) => Promise<Result<CryptoPayment, PaymentError>>;
  cancelUpgradeRequest: (subscriptionId: string) => Promise<Result<boolean>>;
  upgradeCryptoSubscription: (params: CryptoUpgradePaymentParams) => Promise<Result<CryptoPayment, PaymentError>>;
}

/**
 * Crypto payment API composable
 * Handles all crypto payment-related API operations
 */
export function useCryptoPaymentApi(): UseCryptoPaymentApiReturn {
  const logger = useLogger('crypto-payment-api');
  const { fetchWithCsrf } = useFetchWithCsrf();

  /**
   * Create crypto payment request
   */
  const cryptoPayment = async (params: CryptoPaymentParams): Promise<Result<CryptoPayment, PaymentError>> => {
    const { planId, cryptocurrencyIdentifier, subscriptionId, discountCode } = params;

    try {
      const response = await fetchWithCsrf<CryptoPaymentResponse>(
        '/webapi/2/crypto/payments',
        {
          body: convertKeys(
            {
              cryptocurrencyIdentifier,
              planId,
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

  const upgradeCryptoSubscription = async (params: CryptoUpgradePaymentParams): Promise<Result<CryptoPayment, PaymentError>> => {
    const { planId, cryptocurrencyIdentifier, subscriptionId, discountCode } = params;

    try {
      const response = await fetchWithCsrf<CryptoPaymentResponse>(
        '/webapi/2/crypto/upgrade',
        {
          body: {
            cryptocurrencyIdentifier,
            planId,
            subscriptionId,
            discountCode,
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

  const checkCryptoUpgradePayment = async (
    subscriptionId?: string,
  ): Promise<Result<CryptoUpgradePayment>> => {
    try {
      const response = await fetchWithCsrf<CryptoUpgradePaymentResponse>(
        '/webapi/2/crypto/payment/upgrade/',
        {
          query: convertKeys({ subscriptionId }, false, false),
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
          query: convertKeys({ subscriptionId }, false, false),
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
        isUpgrade ? '/webapi/2/crypto/payment/upgrade/' : '/webapi/2/crypto/payment/pending/',
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
        '/webapi/2/crypto/payment/pending/',
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
  const switchCryptoPlan = async (params: CryptoPaymentParams): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const data = await deletePendingPayment();
      if (!data.isError) {
        const payment = await cryptoPayment(params);
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
      const response = await fetchWithCsrf<ActionResultResponse>('/webapi/2/crypto/upgrade/cancel', {
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

  /**
   * Switch crypto upgrade plan (cancel current upgrade and create new)
   */
  const switchCryptoUpgradePlan = async (params: CryptoUpgradePaymentParams): Promise<Result<CryptoPayment, PaymentError>> => {
    const { subscriptionId } = params;

    try {
      // Cancel existing upgrade request
      const cancelResult = await cancelUpgradeRequest(subscriptionId);
      if (cancelResult.isError) {
        return createSimpleErrorResult(cancelResult.error);
      }

      // Create new upgrade payment
      const payment = await upgradeCryptoSubscription(params);
      if (payment.isError) {
        return payment;
      }

      return {
        isError: false,
        result: payment.result,
      };
    }
    catch (error: any) {
      logger.error('Failed to switch crypto upgrade plan:', error);
      return createSimpleErrorResult(error);
    }
  };

  return {
    cancelUpgradeRequest,
    checkCryptoUpgradePayment,
    checkPendingCryptoPayment,
    cryptoPayment,
    deletePendingPayment,
    markTransactionStarted,
    switchCryptoPlan,
    switchCryptoUpgradePlan,
    upgradeCryptoSubscription,
  };
}
