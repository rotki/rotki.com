// TODO: split store functionality
/* eslint-disable max-lines */
import { get, isClient, set, useTimeoutFn } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { useLogger } from '~/utils/use-logger';
import {
  Account,
  ActionResultResponse,
  ApiKeys,
  type ApiResponse,
  type CardCheckout,
  CardCheckoutResponse,
  type CardPaymentRequest,
  ChangePasswordResponse,
  type CryptoPayment,
  CryptoPaymentResponse,
  type PendingCryptoPayment,
  PendingCryptoPaymentResponse,
  type Plan,
  PremiumResponse,
  ResendVerificationResponse,
  type Result,
  type Subscription,
  UpdateProfileResponse,
} from '~/types';
import { PaymentError } from '~/types/codes';
import { fetchWithCsrf } from '~/utils/api';
import { assert } from '~/utils/assert';
import { formatSeconds } from '~/utils/text';
import type { LoginCredentials } from '~/types/login';
import type { ActionResult } from '~/types/common';
import type {
  DeleteAccountPayload,
  PasswordChangePayload,
  ProfilePayload,
} from '~/types/account';
import type { ComposerTranslation } from 'vue-i18n';

const SESSION_TIMEOUT = 3600000;

export const useMainStore = defineStore('main', () => {
  const authenticated = ref(false);
  const account = ref<Account | null>(null);
  const plans = ref<Plan[] | null>(null);
  const authenticatedOnPlansLoad = ref(false);
  const cancellationError = ref('');

  const logger = useLogger('store');

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

  const cancelSubscription = async (subscription: Subscription) => {
    const acc = get(account);
    assert(acc);

    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        `/webapi/subscription/${subscription.identifier}`,
        {
          method: 'DELETE',
        },
      );
      const data = ActionResultResponse.parse(response);
      if (data.result)
        await getAccount();
    }
    catch (error: any) {
      let message = error.message;
      if (error instanceof FetchError && error.status === 404)
        message = ActionResultResponse.parse(error.data).message;

      logger.error(error);
      set(cancellationError, message);
    }
  };

  const getPlans = async (): Promise<void> => {
    if (get(plans) && get(authenticated) === get(authenticatedOnPlansLoad)) {
      logger.debug('plans already loaded');
      return;
    }

    try {
      const response = await fetchWithCsrf<PremiumResponse>(
        '/webapi/premium/',
        {
          method: 'GET',
        },
      );
      const data = PremiumResponse.parse(response);
      set(plans, data.result.plans);
      set(authenticatedOnPlansLoad, get(authenticated));
    }
    catch (error: any) {
      logger.error(error);
    }
  };

  const checkout = async (plan: number): Promise<Result<CardCheckout>> => {
    try {
      const response = await fetchWithCsrf<CardCheckoutResponse>(
        `/webapi/checkout/card/${plan}`,
        {
          method: 'GET',
        },
      );
      const data = CardCheckoutResponse.parse(response);
      return {
        isError: false,
        result: data.result,
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

  const pay = async (
    request: CardPaymentRequest,
  ): Promise<Result<true, PaymentError>> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        '/webapi/payment/btr',
        {
          body: request,
          method: 'POST',
        },
      );
      getAccount().then().catch(error => logger.error(error));

      const data = ActionResultResponse.parse(response);
      assert(data.result);
      return {
        isError: false,
        result: true,
      };
    }
    catch (error_: any) {
      getAccount().then().catch(error => logger.error(error));
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

  const cryptoPayment = async (
    plan: number,
    currencyId: string,
    subscriptionId?: string,
  ): Promise<Result<CryptoPayment, PaymentError>> => {
    try {
      const response = await fetchWithCsrf<CryptoPaymentResponse>(
        '/webapi/payment/crypto',
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
        '/webapi/payment/pending',
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
        'webapi/payment/pending',
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
        'webapi/payment/pending',
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
    plan: number,
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

  const logout = async (callApi = false): Promise<void> => {
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
  };

  const refreshSession = () => {
    if (!isClient)
      return;

    stopCountdown();
    startCountdown();
  };

  return {
    account,
    authenticated,
    cancellationError,
    cancelSubscription,
    changePassword,
    checkout,
    checkPendingCryptoPayment,
    cryptoPayment,
    deleteAccount,
    deletePendingPayment,
    getAccount,
    getPlans,
    login,
    logout,
    markTransactionStarted,
    pay,
    plans,
    refreshSession,
    resendVerificationCode,
    subscriptions,
    switchCryptoPlan,
    updateKeys,
    updateProfile,
  };
});

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot));
