import type { ComposerTranslation } from 'vue-i18n';
import type { ActionResult } from '~/types/common';
import type { LoginCredentials } from '~/types/login';
import { get, isClient, set, useTimeoutFn } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { acceptHMRUpdate, defineStore } from 'pinia';
import {
  ActionResultResponse,
  ApiKeys,
  type ApiResponse,
  ChangePasswordResponse,
  type PreTierSubscription,
  ResendVerificationResponse,
  UpdateProfileResponse,
  UserSubscriptions,
} from '~/types';
import {
  Account,
  type DeleteAccountPayload,
  type PasswordChangePayload,
  type ProfilePayload,
  UserPayments,
} from '~/types/account';
import { fetchWithCsrf } from '~/utils/api';
import { assert } from '~/utils/assert';
import { formatSeconds } from '~/utils/text';
import { useLogger } from '~/utils/use-logger';

const SESSION_TIMEOUT = 3_600_000;

export const useMainStore = defineStore('main', () => {
  const authenticated = ref(false);
  const account = ref<Account | null>(null);
  const userSubscriptions = ref<UserSubscriptions>([]);
  const userPayments = ref<UserPayments>([]);
  const cancellationError = ref('');
  const resumeError = ref('');

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

  const getSubscriptions = async (): Promise<void> => {
    try {
      const response = await fetchWithCsrf<ApiResponse<Account>>(
        '/webapi/2/user/subscriptions',
        {
          method: 'GET',
        },
      );
      set(userSubscriptions, UserSubscriptions.parse(response.result));
    }
    catch (error) {
      logger.error(error);
    }
  };

  const getPayments = async (): Promise<void> => {
    try {
      const response = await fetchWithCsrf<UserPayments>(
        '/webapi/2/payments',
        {
          method: 'GET',
        },
      );

      const parsed = UserPayments.parse(response);
      set(userPayments, parsed);
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

  const refreshUserData = async () => {
    await getAccount();
    await getSubscriptions();
    await getPayments();
  };

  const refreshSubscriptionsAndPayments = () => {
    Promise.allSettled([
      getSubscriptions(),
      getPayments(),
    ]).then().catch(error => logger.error(error));
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
      await refreshUserData();
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

  const subscriptions = computed<PreTierSubscription[]>(() => {
    const userAccount = get(account);
    if (!userAccount)
      return [];

    return userAccount.subscriptions;
  });

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

  return {
    account,
    authenticated,
    cancellationError,
    changePassword,
    deleteAccount,
    getAccount,
    getPayments,
    getSubscriptions,
    login,
    logout,
    refreshSession,
    refreshSubscriptionsAndPayments,
    refreshUserData,
    resendVerificationCode,
    resumeError,
    subscriptions,
    updateKeys,
    updateProfile,
    userPayments,
    userSubscriptions,
  };
});

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot));
