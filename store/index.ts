import { get, isClient, set, useTimeoutFn } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { type Currency } from '~/composables/plan';
import {
  Account,
  ApiKeys,
  type ApiResponse,
  CancelSubscriptionResponse,
  type CardCheckout,
  CardCheckoutResponse,
  type CardPaymentRequest,
  CardPaymentResponse,
  ChangePasswordResponse,
  type CryptoPayment,
  CryptoPaymentResponse,
  DeleteAccountResponse,
  type PendingCryptoPayment,
  PendingCryptoPaymentResponse,
  PendingCryptoPaymentResultResponse,
  type Plan,
  PremiumResponse,
  type Result,
  type SubStatus,
  type Subscription,
  UpdateProfileResponse,
} from '~/types';
import {
  type DeleteAccountPayload,
  type PasswordChangePayload,
  type ProfilePayload,
} from '~/types/account';
import { PaymentError } from '~/types/codes';
import { type ActionResult } from '~/types/common';
import { type LoginCredentials } from '~/types/login';
import { fetchWithCsrf } from '~/utils/api';
import { assert } from '~/utils/assert';
import { logger } from '~/utils/logger';

const SESSION_TIMEOUT = 3600000;

export const useMainStore = defineStore('main', () => {
  const authenticated = ref(false);
  const account = ref<Account | null>(null);
  const plans = ref<Plan[] | null>(null);
  const authenticatedOnPlansLoad = ref(false);
  const cancellationError = ref('');

  const getAccount = async (): Promise<void> => {
    try {
      const response = await fetchWithCsrf<ApiResponse<Account>>(
        '/webapi/account/',
        {
          method: 'get',
        }
      );
      set(authenticated, true);
      set(account, Account.parse(response.result));
    } catch (e) {
      logger.error(e);
    }
  };

  const login = async ({
    username,
    password,
  }: LoginCredentials): Promise<string> => {
    try {
      await fetchWithCsrf<string>('/webapi/login/', {
        method: 'post',
        credentials: 'include',
        body: {
          username,
          password,
        },
      });
      await getAccount();
      set(authenticated, true);
      return '';
    } catch (e: any) {
      let message = e.message;
      if (e instanceof FetchError) {
        const status = e?.status || -1;
        if (status === 400 && e.response) {
          message = e.data.message || '';
        }
      }
      set(authenticated, false);
      return message;
    }
  };

  const updateKeys = async () => {
    try {
      const response = await fetchWithCsrf<ApiResponse<ApiKeys>>(
        '/webapi/regenerate-keys/',
        {
          method: 'patch',
        }
      );
      const acc = get(account);
      assert(acc);
      set(account, {
        ...acc,
        ...ApiKeys.parse(response.result),
      });
    } catch (e) {
      logger.error(e);
    }
  };

  const changePassword = async (
    payload: PasswordChangePayload
  ): Promise<ActionResult> => {
    try {
      const response = await fetchWithCsrf<ChangePasswordResponse>(
        '/webapi/change-password/',
        {
          method: 'patch',
          body: payload,
        }
      );
      const data = ChangePasswordResponse.parse(response);
      return {
        success: data.result ?? false,
        message: '',
      };
    } catch (e: any) {
      logger.error(e);
      let message = e.message;
      if (e instanceof FetchError && e.status === 400) {
        const data = ChangePasswordResponse.parse(e.data);
        message = data.message;
      }
      return {
        success: false,
        message,
      };
    }
  };

  const updateProfile = async (
    payload: ProfilePayload
  ): Promise<ActionResult> => {
    try {
      const response = await fetchWithCsrf<UpdateProfileResponse>(
        '/webapi/account/',
        {
          method: 'patch',
          body: payload,
        }
      );

      const { result } = UpdateProfileResponse.parse(response);
      const acc = get(account);
      assert(result);
      assert(acc);
      const country = acc.address?.country ?? '';
      set(account, {
        ...acc,
        ...result,
      });

      if (payload.country !== country) {
        await getAccount();
      }
      return { success: true };
    } catch (e: any) {
      logger.error(e);
      let message = e.message;
      if (e instanceof FetchError && e.status === 400) {
        message = UpdateProfileResponse.parse(e.data).message;
      }
      return {
        success: false,
        message,
      };
    }
  };

  const deleteAccount = async (
    payload: DeleteAccountPayload
  ): Promise<ActionResult> => {
    try {
      const response = await fetchWithCsrf<DeleteAccountResponse>(
        '/webapi/account/',
        {
          body: payload,
          method: 'delete',
        }
      );

      const data = DeleteAccountResponse.parse(response);
      return {
        success: data.result ?? false,
        message: data.message,
      };
    } catch (e: any) {
      let message = e.message;
      if (e instanceof FetchError && e.status === 400) {
        message = DeleteAccountResponse.parse(e.data).message;
      }
      logger.error(e);
      return {
        success: false,
        message,
      };
    }
  };

  const { stop, start } = useTimeoutFn(() => set(cancellationError, ''), 7000);

  const cancelSubscription = async (subscription: Subscription) => {
    const acc = get(account);
    assert(acc);
    const subscriptions = [...acc.subscriptions];
    const subIndex = subscriptions.findIndex(
      (sub) => sub.identifier === subscription.identifier
    );
    const sub = subscriptions[subIndex];
    const { actions, status, nextActionDate } = sub;

    function updateSub(
      actions: string[],
      status: SubStatus,
      nextActionDate: string
    ) {
      sub.actions = actions;
      sub.status = status;
      sub.nextActionDate = nextActionDate;
      assert(acc);
      set(account, {
        ...acc,
        subscriptions,
      });
    }

    try {
      updateSub([], 'Cancelled', 'Never');
      const response = await fetchWithCsrf<CancelSubscriptionResponse>(
        `/webapi/subscription/${subscription.identifier}`,
        {
          method: 'delete',
        }
      );
      const data = CancelSubscriptionResponse.parse(response);
      if (data.result) {
        await getAccount();
      }
    } catch (e: any) {
      let message = e.message;
      if (e instanceof FetchError && e.status === 404) {
        message = CancelSubscriptionResponse.parse(e.data).message;
      }
      updateSub(actions, status, nextActionDate);
      logger.error(e);
      stop();
      set(cancellationError, message);
      start();
    }
  };

  const getPlans = async (): Promise<void> => {
    if (get(plans) && get(authenticated) === get(authenticatedOnPlansLoad)) {
      logger.debug('plans already loaded');
      return;
    }

    try {
      const response = await fetchWithCsrf<PremiumResponse>('/webapi/premium', {
        method: 'get',
      });
      const data = PremiumResponse.parse(response);
      set(plans, data.result.plans);
      set(authenticatedOnPlansLoad, get(authenticated));
    } catch (e: any) {
      logger.error(e);
    }
  };

  const checkout = async (plan: number): Promise<Result<CardCheckout>> => {
    try {
      const response = await fetchWithCsrf<CardCheckoutResponse>(
        `/webapi/checkout/card/${plan}`,
        {
          method: 'get',
        }
      );
      const data = CardCheckoutResponse.parse(response);
      return {
        isError: false,
        result: data.result,
      };
    } catch (e: any) {
      logger.error(e);
      return {
        isError: true,
        error: e,
      };
    }
  };

  const pay = async (
    request: CardPaymentRequest
  ): Promise<Result<true, PaymentError>> => {
    try {
      const response = await fetchWithCsrf<CardPaymentResponse>(
        '/webapi/payment/btr',
        {
          method: 'post',
          body: request,
        }
      );
      getAccount().then();

      const data = CardPaymentResponse.parse(response);
      assert(data.result);
      return {
        isError: false,
        result: true,
      };
    } catch (e: any) {
      let error = e;
      let code: PaymentError | undefined = undefined;
      if (e instanceof FetchError) {
        if (e.status === 400) {
          error = new Error(CardPaymentResponse.parse(e.data).message);
        } else if (e.status === 403) {
          error = '';
          code = PaymentError.UNVERIFIED;
        }
      }
      logger.error(e);
      return {
        isError: true,
        error,
        code,
      };
    }
  };

  const cryptoPayment = async (
    plan: number,
    currency: Currency,
    subscriptionId?: string
  ): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const response = await fetchWithCsrf<CryptoPaymentResponse>(
        '/webapi/payment/crypto',
        {
          method: 'post',
          body: convertKeys(
            {
              currency,
              months: plan,
              subscriptionId,
            },
            false,
            false
          ),
        }
      );

      const { result } = CryptoPaymentResponse.parse(response);
      assert(result);
      return {
        result,
        isError: false,
      };
    } catch (e: any) {
      let error = e;
      let code: PaymentError | undefined = undefined;
      if (e instanceof FetchError) {
        if (e.status === 400) {
          error = new Error(CardPaymentResponse.parse(e.data).message);
        } else if (e.status === 403) {
          error = '';
          code = PaymentError.UNVERIFIED;
        }
      }
      logger.error(e);
      return {
        error,
        isError: true,
        code,
      };
    }
  };

  const checkPendingCryptoPayment = async (
    subscriptionId?: string
  ): Promise<Result<PendingCryptoPayment>> => {
    try {
      const response = await fetchWithCsrf<PendingCryptoPaymentResponse>(
        '/webapi/payment/pending',
        {
          params: convertKeys({ subscriptionId }, false, false),
        }
      );
      const data = PendingCryptoPaymentResponse.parse(response);
      if (data.result) {
        return {
          result: data.result,
          isError: false,
        };
      }
      return {
        error: new Error(data.message),
        isError: true,
      };
    } catch (e: any) {
      logger.error(e);
      return {
        error: e,
        isError: true,
      };
    }
  };

  const markTransactionStarted = async (): Promise<Result<boolean>> => {
    try {
      const response = await fetchWithCsrf<PendingCryptoPaymentResultResponse>(
        'webapi/payment/pending',
        {
          method: 'patch',
        }
      );
      const data = PendingCryptoPaymentResultResponse.parse(response);
      if (data.result) {
        return {
          result: data.result,
          isError: false,
        };
      }
      return {
        error: new Error(data.message),
        isError: true,
      };
    } catch (e: any) {
      logger.error(e);
      return {
        error: e,
        isError: true,
      };
    }
  };

  const switchCryptoPlan = async (
    plan: number,
    currency: Currency,
    subscriptionId?: string
  ): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const response = await fetchWithCsrf<PendingCryptoPaymentResultResponse>(
        'webapi/payment/pending',
        {
          method: 'delete',
        }
      );
      const data = PendingCryptoPaymentResultResponse.parse(response);
      if (data.result) {
        const payment = await cryptoPayment(plan, currency, subscriptionId);
        if (payment.isError) {
          return payment;
        }
        return {
          isError: false,
          result: payment.result,
        };
      }
      return {
        error: new Error(data.message),
        isError: true,
      };
    } catch (e: any) {
      logger.error(e);
      return {
        error: e,
        isError: true,
      };
    }
  };

  const { stop: stopCountdown, start: startCountdown } = useTimeoutFn(
    async () => {
      logger.debug('session expired, logging out');
      await logout();
    },
    SESSION_TIMEOUT
  );

  const logout = async (callApi = false): Promise<void> => {
    stopCountdown();
    if (callApi) {
      try {
        await fetchWithCsrf<UpdateProfileResponse>('/webapi/logout/', {
          method: 'post',
        });
      } catch (e) {
        logger.error(e);
      }
    }
    set(authenticated, false);
    set(account, null);
  };

  const refreshSession = () => {
    if (!isClient) {
      return;
    }
    stopCountdown();
    startCountdown();
  };

  return {
    authenticated,
    account,
    plans,
    cancellationError,
    login,
    getAccount,
    changePassword,
    updateKeys,
    updateProfile,
    deleteAccount,
    cancelSubscription,
    getPlans,
    checkout,
    pay,
    cryptoPayment,
    checkPendingCryptoPayment,
    switchCryptoPlan,
    markTransactionStarted,
    logout,
    refreshSession,
  };
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot));
}
