// TODO: split store functionality
/* eslint-disable max-lines */
import type { ComposerTranslation } from 'vue-i18n';
import type { DeleteAccountPayload, PasswordChangePayload, ProfilePayload } from '~/types/account';
import type { ActionResult } from '~/types/common';
import type { LoginCredentials } from '~/types/login';
import { get, isClient, set, useTimeoutFn } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import {
  Account,
  ActionResultResponse,
  ApiKeys,
  type ApiResponse,
  ChangePasswordResponse,
  type CryptoPayment,
  CryptoPaymentResponse,
  type PendingCryptoPayment,
  PendingCryptoPaymentResponse,
  ResendVerificationResponse,
  type Result,
  type SelectedPlan,
  type Subscription,
  UpdateProfileResponse,
} from '~/types';
import { PaymentError } from '~/types/codes';
import { assert } from '~/utils/assert';
import { convertKeys } from '~/utils/object';
import { formatSeconds } from '~/utils/text';
import { useLogger } from '~/utils/use-logger';

const SESSION_TIMEOUT = 3600000;

export const useMainStore = defineStore('main', () => {
  const authenticated = ref(false);
  const account = ref<Account | null>(null);
  const cancellationError = ref('');
  const resumeError = ref('');

  const logger = useLogger('store');
  const { fetchWithCsrf, setHooks } = useFetchWithCsrf();

  const getAccount = async (): Promise<void> => {
    try {
      const response = await fetchWithCsrf<ApiResponse<Account>>(
        '/webapi/account/',
        {
          method: 'GET',
        },
      );
      set(authenticated, true);
      set(account, Account.parse(response.result));
    }
    catch (error) {
      logger.error(error);
    }
  };

  const resendVerificationCode = async (t: ComposerTranslation): Promise<ActionResult> => {
    const onError = (data: ResendVerificationResponse) => {
      let message = data.message;
      if (isDefined(data.allowedIn)) {
        const formatted = formatSeconds(data.allowedIn);
        const formattedMessage = [];
        if (formatted.minutes)
          formattedMessage.push(t('account.unverified_email.message.time.minutes', { number: formatted.minutes }));

        if (formatted.seconds)
          formattedMessage.push(t('account.unverified_email.message.time.seconds', { number: formatted.seconds }));

        message += `\n${t('account.unverified_email.message.try_again', {
          time: formattedMessage.join(' '),
        })}`;
      }

      return {
        message,
        success: false,
      };
    };
    try {
      const response = await fetchWithCsrf<ResendVerificationResponse>(
        '/webapi/email-verification/',
        {
          method: 'GET',
        },
      );

      const data = ResendVerificationResponse.parse(response);
      if (data.result) {
        return {
          message: '',
          success: true,
        };
      }
      else {
        return onError(data);
      }
    }
    catch (error: any) {
      logger.error(error);
      if (error instanceof FetchError)
        return onError(error.data);

      const message = error.message;

      return {
        message,
        success: false,
      };
    }
  };

  const login = async ({
    password,
    username,
  }: LoginCredentials): Promise<string> => {
    try {
      await fetchWithCsrf<string>('/webapi/login/', {
        body: {
          password,
          username,
        },
        credentials: 'include',
        method: 'POST',
      });
      await getAccount();
      return '';
    }
    catch (error: any) {
      let message = error.message;
      if (error instanceof FetchError) {
        const status = error?.status || -1;
        if (status === 400 && error.response)
          message = error.data.message || '';
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
          method: 'PATCH',
        },
      );
      const acc = get(account);
      assert(acc);
      set(account, {
        ...acc,
        ...ApiKeys.parse(response.result),
      });
    }
    catch (error) {
      logger.error(error);
    }
  };

  const changePassword = async (
    payload: PasswordChangePayload,
  ): Promise<ActionResult> => {
    try {
      const response = await fetchWithCsrf<ChangePasswordResponse>(
        '/webapi/change-password/',
        {
          body: payload,
          method: 'PATCH',
        },
      );
      const data = ChangePasswordResponse.parse(response);
      return {
        message: '',
        success: data.result ?? false,
      };
    }
    catch (error: any) {
      logger.error(error);
      let message = error.message;
      if (error instanceof FetchError && error.status === 400) {
        const data = ChangePasswordResponse.parse(error.data);
        message = data.message;
      }
      return {
        message,
        success: false,
      };
    }
  };

  const updateProfile = async (
    payload: ProfilePayload,
  ): Promise<ActionResult> => {
    try {
      const response = await fetchWithCsrf<UpdateProfileResponse>(
        '/webapi/account/',
        {
          body: payload,
          method: 'PATCH',
        },
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

      if (payload.country !== country)
        await getAccount();

      return { success: true };
    }
    catch (error: any) {
      logger.error(error);
      let message = error.message;
      if (error instanceof FetchError && error.status === 400)
        message = UpdateProfileResponse.parse(error.data).message;

      return {
        message,
        success: false,
      };
    }
  };

  const deleteAccount = async (
    payload: DeleteAccountPayload,
  ): Promise<ActionResult> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        '/webapi/account/',
        {
          body: payload,
          method: 'DELETE',
        },
      );

      const data = ActionResultResponse.parse(response);
      return {
        message: data.message,
        success: data.result ?? false,
      };
    }
    catch (error: any) {
      let message = error.message;
      if (error instanceof FetchError && error.status === 400)
        message = ActionResultResponse.parse(error.data).message;

      logger.error(error);
      return {
        message,
        success: false,
      };
    }
  };

  const subscriptions = computed<Subscription[]>(() => {
    const userAccount = get(account);
    if (!userAccount)
      return [];

    return userAccount.subscriptions;
  });

  const checkGetAccount = () => {
    getAccount().then().catch(error => logger.error(error));
  };

  const cryptoPayment = async (
    plan: SelectedPlan,
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
              months: plan.durationInMonths,
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

  function getPendingSubscription({ amount, date, duration }: {
    amount: string;
    duration: number;
    date: number;
  }): Subscription | undefined {
    const subDate = new Date(date * 1000);
    return get(subscriptions).find((subscription) => {
      const [day, month, year] = subscription.createdDate.split('/').map(Number);
      const createdDate = new Date(year, month - 1, day);
      return subscription.status === 'Pending'
        && subscription.durationInMonths === duration
        && subscription.nextBillingAmount === amount
        && createdDate.toDateString() === subDate.toDateString();
    });
  }

  const markTransactionStarted = async (): Promise<Result<boolean>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        'webapi/payment/pending/',
        {
          method: 'PATCH',
        },
      );
      const data = ActionResultResponse.parse(response);
      getAccount().then().catch(error => logger.error(error));
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
      getAccount().then().catch(error => logger.error(error));
      logger.error(error);
      return {
        error,
        isError: true,
      };
    }
  };

  const deletePendingPayment = async (): Promise<Result<boolean>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        'webapi/payment/pending/',
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
    subscriptionId?: string,
  ): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const data = await deletePendingPayment();
      if (!data.isError) {
        const payment = await cryptoPayment(plan, currency, subscriptionId);
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

  const { start: startCountdown, stop: stopCountdown } = useTimeoutFn(
    async () => {
      logger.debug('session expired, logging out');
      await logout();
    },
    SESSION_TIMEOUT,
  );

  async function logout(callApi = false): Promise<void> {
    stopCountdown();
    if (callApi) {
      try {
        await fetchWithCsrf<UpdateProfileResponse>('/webapi/logout/', {
          method: 'POST',
        });
      }
      catch (error) {
        logger.error(error);
      }
    }
    set(authenticated, false);
    set(account, null);
  }

  const refreshSession = () => {
    if (!isClient)
      return;

    stopCountdown();
    startCountdown();
  };

  setHooks({
    logout,
    refresh: refreshSession,
  });

  return {
    account,
    authenticated,
    cancellationError,
    changePassword,
    checkGetAccount,
    checkPendingCryptoPayment,
    cryptoPayment,
    deleteAccount,
    deletePendingPayment,
    getAccount,
    getPendingSubscription,
    login,
    logout,
    markTransactionStarted,
    refreshSession,
    resendVerificationCode,
    resumeError,
    subscriptions,
    switchCryptoPlan,
    updateKeys,
    updateProfile,
  };
});

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot));
