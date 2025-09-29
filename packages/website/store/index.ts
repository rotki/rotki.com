import type { Account } from '@rotki/card-payment-common/schemas/account';
import type { LoginCredentials } from '~/types/login';
import { get, isClient, set, useTimeoutFn } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAccountApi } from '~/composables/use-account-api';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useAuthApi } from '~/composables/use-auth-api';
import { useFetchUserSubscriptions } from '~/composables/use-fetch-user-subscriptions';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useLogger } from '~/utils/use-logger';

const SESSION_TIMEOUT = 3600000;

export const useMainStore = defineStore('main', () => {
  const authenticated = ref<boolean>(false);
  const account = ref<Account>();
  const canBuy = ref<boolean>(true);
  const pendingSubscriptionId = ref<string>();

  const logger = useLogger('store');
  const { setHooks } = useFetchWithCsrf();

  // API composables
  const accountApi = useAccountApi();
  const authApi = useAuthApi();
  const { fetchUserSubscriptions } = useFetchUserSubscriptions();
  const { onRefresh } = useAccountRefresh();

  const updateCanBuy = async (): Promise<void> => {
    const accountVal = get(account);

    if (!accountVal) {
      set(canBuy, true);
      set(pendingSubscriptionId, undefined);
      return;
    }

    try {
      const { hasActiveSubscription } = accountVal;

      if (!hasActiveSubscription) {
        set(canBuy, true);
        set(pendingSubscriptionId, undefined);
        return;
      }

      const subscriptions = await fetchUserSubscriptions();
      if (subscriptions.length === 0) {
        set(canBuy, true);
        set(pendingSubscriptionId, undefined);
        return;
      }

      const renewableSubscriptions = subscriptions.filter(({ actions }) =>
        actions.includes('renew'),
      );

      const pendingSubscription = subscriptions.find(({ status }) => status === 'Pending');

      set(canBuy, renewableSubscriptions.length > 0);
      set(pendingSubscriptionId, pendingSubscription?.id);
    }
    catch (error) {
      logger.error('Failed to update canBuy status:', error);
      // Default to true on error to not block users
      set(canBuy, true);
      set(pendingSubscriptionId, undefined);
    }
  };

  const getAccount = async (): Promise<void> => {
    const accountData = await accountApi.getAccount();
    if (accountData) {
      set(authenticated, true);
      set(account, accountData);
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
    set(account, null);
    set(canBuy, true); // Reset to default
    set(pendingSubscriptionId, undefined);
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
    canBuy: readonly(canBuy),
    getAccount,
    login,
    logout,
    pendingSubscriptionId: readonly(pendingSubscriptionId),
    refreshSession,
  };
});

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot));
