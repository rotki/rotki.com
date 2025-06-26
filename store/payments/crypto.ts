import { set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store';
import {
  ActionResultResponse,
  type CryptoPayment,
  CryptoPaymentResponse,
  PaymentAssetResponse,
  type PendingCryptoPayment,
  PendingCryptoPaymentResponse,
  type Result,
  type SelectedPlan,
} from '~/types';
import { PaymentError } from '~/types/codes';
import { assert } from '~/utils/assert';
import { useLogger } from '~/utils/use-logger';

export const usePaymentCryptoStore = defineStore('payments/crypto', () => {
  const store = useMainStore();
  const { refreshSubscriptionsAndPayments } = store;
  const paymentAssetsLoading = ref(false);
  const paymentAssets = ref<PaymentAssetResponse>({});

  const logger = useLogger('crypto-payment');
  const { fetchWithCsrf } = useFetchWithCsrf();

  const fetchPaymentAssets = async (): Promise<void> => {
    set(paymentAssetsLoading, true);
    try {
      const response = await fetchWithCsrf<PaymentAssetResponse>('/webapi/payment/crypto/options/', {
        method: 'GET',
      });
      set(paymentAssets, PaymentAssetResponse.parse(response));
    }
    catch (error) {
      logger.error(error);
    }
    finally {
      set(paymentAssetsLoading, false);
    }
  };

  const cryptoPayment = async (
    plan: SelectedPlan,
    cryptocurrencyIdentifier: string,
    subscriptionId: string | number | undefined,
    discountCode: string | undefined,
  ): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const { planId } = plan;
      const response = await fetchWithCsrf<CryptoPaymentResponse>(
        '/webapi/2/crypto/payments',
        {
          body: convertKeys(
            {
              cryptocurrencyIdentifier,
              discountCode,
              planId,
              subscriptionId,
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
    catch (error_: any) {
      let error = error_;
      let code: PaymentError | undefined;
      if (error_ instanceof FetchError) {
        if (error_.status === 400) {
          error = new Error(ActionResultResponse.parse(error_.data).message);
        }
        else if (error_.status === 403) {
          error = '';
          code = PaymentError.UNVERIFIED;
        }
      }
      logger.error(error_);
      return {
        code,
        error,
        isError: true,
      };
    }
  };

  const deletePendingCryptoPayment = async (): Promise<Result<boolean>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        'webapi/2/crypto/payment/pending/',
        {
          method: 'DELETE',
        },
      );
      const data = ActionResultResponse.parse(response);
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

  const switchCryptoPlan = async (
    plan: SelectedPlan,
    currency: string,
    subscriptionId?: string | number,
    discountCode?: string | undefined,
  ): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const data = await deletePendingCryptoPayment();
      if (!data.isError) {
        const payment = await cryptoPayment(plan, currency, subscriptionId, discountCode);
        if (payment.isError)
          return payment;

        return {
          isError: false,
          result: payment.result,
        };
      }
      return {
        error: data.error,
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
      logger.error(error);
      return {
        error,
        isError: true,
      };
    }
  };

  const markTransactionStarted = async (): Promise<Result<boolean>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        'webapi/2/crypto/payment/pending/',
        {
          method: 'PATCH',
        },
      );
      const data = ActionResultResponse.parse(response);
      refreshSubscriptionsAndPayments();
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
      refreshSubscriptionsAndPayments();
      logger.error(error);
      return {
        error,
        isError: true,
      };
    }
  };

  return {
    checkPendingCryptoPayment,
    cryptoPayment,
    deletePendingCryptoPayment,
    fetchPaymentAssets,
    markTransactionStarted,
    paymentAssets,
    paymentAssetsLoading,
    switchCryptoPlan,
  };
});
