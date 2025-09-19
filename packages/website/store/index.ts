import type {
  Account,
  Plan,
  Subscription,
} from '~/types';
import type { LoginCredentials } from '~/types/login';
import { get, isClient, set, useTimeoutFn } from '@vueuse/core';
import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAccountApi } from '~/composables/use-account-api';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useAuthApi } from '~/composables/use-auth-api';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { usePaymentApi } from '~/composables/use-payment-api';
import { useLogger } from '~/utils/use-logger';

const SESSION_TIMEOUT = 3600000;

export const useMainStore = defineStore('main', () => {
  const authenticated = ref(false);
  const account = ref<Account | null>(null);
  const plans = ref<Plan[] | null>(null);
  const authenticatedOnPlansLoad = ref(false);
  const cancellationError = ref('');
  const resumeError = ref('');

  const logger = useLogger('store');
  const { setHooks } = useFetchWithCsrf();

  // API composables
  const accountApi = useAccountApi();
  const authApi = useAuthApi();
  const paymentApi = usePaymentApi();
  const { onRefresh } = useAccountRefresh();

  const getAccount = async (): Promise<void> => {
    const accountData = await accountApi.getAccount();
    if (accountData) {
      set(authenticated, true);
      set(account, accountData);
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

  const subscriptions = computed<Subscription[]>(() => {
    const userAccount = get(account);
    if (!userAccount)
      return [];

    return userAccount.subscriptions;
  });

  const getPlans = async (): Promise<void> => {
    if (get(plans) && get(authenticated) === get(authenticatedOnPlansLoad)) {
      logger.debug('plans already loaded');
      return;
    }

    const plansData = await paymentApi.getPlans();
    if (plansData) {
      set(plans, plansData);
      set(authenticatedOnPlansLoad, get(authenticated));
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
    getAccount,
    getPendingSubscription,
    getPlans,
    login,
    logout,
    plans,
    refreshSession,
    resumeError,
    subscriptions,
  };
});

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useMainStore, import.meta.hot));
