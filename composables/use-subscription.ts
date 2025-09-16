import type { PaymentError } from '~/types/codes';
import { set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store';
import {
  ActionResultResponse,
  type CryptoPayment,
  CryptoPaymentResponse,
  type Result,
  type UserSubscription,
} from '~/types';
import { assert } from '~/utils/assert';

interface UseSubscriptionReturn {
  cancelUserSubscription: (sub: UserSubscription) => Promise<void>;
  resumeUserSubscription: (sub: UserSubscription) => Promise<void>;
  upgradeBraintreeSubscription: (subscription: UserSubscription, planId: number) => Promise<Result<boolean>>;
  upgradeCryptoSubscription: (subId: string, planId: number, currency: string) => Promise<Result<CryptoPayment, PaymentError>>;
}

export function useSubscription(): UseSubscriptionReturn {
  const store = useMainStore();
  const { cancellationError, resumeError } = storeToRefs(store);
  const { getSubscriptions } = store;
  const { fetchWithCsrf } = useFetchWithCsrf();

  const resumeUserSubscription = async (sub: UserSubscription) => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        `/webapi/2/subscriptions/${sub.id}/resume/`,
        {
          method: 'PATCH',
        },
      );
      const data = ActionResultResponse.parse(response);
      if (data.result)
        await getSubscriptions();
    }
    catch (error: any) {
      let message = error.message;
      if (error instanceof FetchError && error.status === 404)
        message = ActionResultResponse.parse(error.data).message;

      logger.error(error);
      set(resumeError, message);
    }
  };

  const cancelUserSubscription = async (sub: UserSubscription): Promise<void> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        `/webapi/2/subscriptions/${sub.id}/`,
        {
          method: 'DELETE',
        },
      );
      const data = ActionResultResponse.parse(response);
      if (data.result)
        await getSubscriptions();
    }
    catch (error: any) {
      let message = error.message;
      if (error instanceof FetchError && error.status === 404)
        message = ActionResultResponse.parse(error.data).message;

      logger.error(error);
      set(cancellationError, message);
    }
  };

  const upgradeBraintreeSubscription = async (subscription: UserSubscription, planId: number): Promise<Result<boolean>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        '/webapi/2/braintree/upgrade',
        {
          body: {
            planId,
            subscriptionId: subscription.id,
          },
          method: 'POST',
        },
      );
      const data = ActionResultResponse.parse(response);
      if (data.result) {
        await getSubscriptions();
        return {
          isError: false,
          result: true,
        };
      }
      return {
        error: new Error(data.message || 'Upgrade failed'),
        isError: true,
      };
    }
    catch (error: any) {
      logger.error(error);
      let message = error.message;
      if (error instanceof FetchError && error.status === 400) {
        message = ActionResultResponse.parse(error.data).message;
      }
      return {
        error: new Error(message),
        isError: true,
      };
    }
  };

  const upgradeCryptoSubscription = async (subId: string, planId: number, currency: string): Promise<Result<CryptoPayment, PaymentError>> => {
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
      logger.error(error);
      let message = error.message;
      if (error instanceof FetchError && error.status === 400) {
        message = ActionResultResponse.parse(error.data).message;
      }
      return {
        error: new Error(message),
        isError: true,
      };
    }
  };

  return {
    cancelUserSubscription,
    resumeUserSubscription,
    upgradeBraintreeSubscription,
    upgradeCryptoSubscription,
  };
}
