import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { LoginCredentials } from '~/types/login';
import { isSubPending, isSubRequestingUpgrade } from '@rotki/card-payment-common';
import { isClient, useTimeoutFn } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAccountApi } from '~/composables/account/use-account-api';
import { useAuthApi } from '~/composables/account/use-auth-api';
import { useUserSubscriptions } from '~/composables/subscription/use-user-subscriptions';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useAuthHintCookie, useEmailConfirmedCookie, useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { usePendingSubscriptionId } from '~/modules/checkout/composables/use-pending-subscription-id';
import { isUnauthorizedError } from '~/utils/api-error-handling';
import { useLogger } from '~/utils/use-logger';

const SESSION_TIMEOUT = 3600000;

export const useMainStore = defineStore('main', () => {
  const authenticated = ref<boolean>(false);
  const account = ref<Account>();
  const canBuy = ref<boolean>(true);

  const logger = useLogger('store');
  const { setHooks } = useFetchWithCsrf();
  const authHintCookie = useAuthHintCookie();
  const emailConfirmedCookie = useEmailConfirmedCookie();
  const { pendingSubscriptionId, setPendingSubscriptionId, clearPendingSubscriptionId } = usePendingSubscriptionId();

  // API composables
  const accountApi = useAccountApi();
  const authApi = useAuthApi();
  const { userSubscriptions, refresh: refreshSubscriptions } = useUserSubscriptions();
  const { onRefresh } = useAccountRefresh();

  const updateCanBuy = async (): Promise<void> => {
    const accountVal = get(account);

    if (!accountVal) {
      set(canBuy, true);
      clearPendingSubscriptionId();
      return;
    }

    try {
      const { hasActiveSubscription } = accountVal;

      if (!hasActiveSubscription) {
        set(canBuy, true);
        clearPendingSubscriptionId();
        return;
      }

      // Refresh subscriptions via useAsyncData (deduped with other consumers)
      await refreshSubscriptions();
      const subscriptions = get(userSubscriptions);
      if (subscriptions.length === 0) {
        set(canBuy, true);
        clearPendingSubscriptionId();
        return;
      }

      const renewableSubscriptions = subscriptions.filter(({ actions }) =>
        actions.includes('renew'),
      );

      const pendingSubscription = subscriptions.find(sub => isSubPending(sub) || isSubRequestingUpgrade(sub));

      set(canBuy, renewableSubscriptions.length > 0);
      setPendingSubscriptionId(pendingSubscription?.id);
    }
    catch (error) {
      if (!isUnauthorizedError(error)) {
        logger.error('Failed to update canBuy status:', error);
      }
      // Default to true on error to not block users
      set(canBuy, true);
      clearPendingSubscriptionId();
    }
  };

  const getAccount = async (): Promise<void> => {
    const accountData = await accountApi.getAccount();
    if (accountData) {
      set(authenticated, true);
      set(account, accountData);
      set(authHintCookie, '1');
      set(emailConfirmedCookie, accountData.emailConfirmed);
      // Update canBuy after account is set
      await updateCanBuy();
    }
  };

  // Subscribe to account refresh events after getAccount is defined
  onRefresh(async () => {
    logger.debug('Handling account refresh event');
    try {
      await getAccount();
    }
    catch (error) {
      logger.error('Failed to refresh account:', error);
    }
  });

  const login = async ({ password, username }: LoginCredentials): Promise<string> => {
    const errorMessage = await authApi.login({ password, username });
    if (!errorMessage) {
      await getAccount();
    }
    else {
      set(authenticated, false);
    }
    return errorMessage;
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
      await authApi.logout();
    }
    set(authenticated, false);
    set(account, undefined);
    set(authHintCookie, undefined);
    set(emailConfirmedCookie, undefined);
    set(canBuy, true); // Reset to default
    clearPendingSubscriptionId();
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
    canBuy: computed<boolean>(() => get(canBuy)),
    getAccount,
    login,
    logout,
    pendingSubscriptionId: computed<string | null | undefined>(() => get(pendingSubscriptionId)),
    refreshSession,
  };
});

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot));
