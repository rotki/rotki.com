import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import { isSubActive, isSubPending } from '@rotki/card-payment-common';
import { type Subscription as UserSubscription, type UserSubscriptions, UserSubscriptionsSchema } from '@rotki/card-payment-common/schemas/subscription';
import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useLogger } from '~/utils/use-logger';

interface UseUserSubscriptionsReturn {
  activeOrPendingSubscription: ComputedRef<UserSubscription | undefined>;
  activeSubscription: ComputedRef<UserSubscription | undefined>;
  initialLoading: Readonly<Ref<boolean>>;
  loading: Readonly<Ref<boolean>>;
  refresh: () => Promise<void>;
  userSubscriptions: Readonly<Ref<UserSubscription[]>>;
}

/**
 * Composable for managing user subscriptions with auto-loading and caching
 * Uses Nuxt's useAsyncData for optimal performance and parallel loading
 */
export function useUserSubscriptions(): UseUserSubscriptionsReturn {
  const logger = useLogger('subscriptions');
  const { fetchWithCsrf } = useFetchWithCsrf();

  const initialLoading = ref<boolean>(true);

  const {
    data: userSubscriptions,
    error,
    pending: loading,
    refresh,
  } = useAsyncData<UserSubscription[]>(
    'user-subscriptions',
    async () => {
      try {
        const response = await fetchWithCsrf<ApiResponse<UserSubscriptions>>(
          '/webapi/2/history/subscriptions',
          {
            method: 'GET',
          },
        );
        return UserSubscriptionsSchema.parse(response.result);
      }
      catch (error) {
        logger.error('Failed to fetch subscriptions:', error);
        return [];
      }
    },
    {
      default: () => [] satisfies UserSubscription[],
      lazy: false,
      server: false,
    },
  );

  /**
   * Returns the active subscription (truly active, not pending)
   * Used for operations like payment method management
   */
  const activeSubscription = computed<UserSubscription | undefined>(() =>
    get(userSubscriptions).find(sub => isSubActive(sub)),
  );

  /**
   * Returns active or pending subscription for display purposes
   * Used for displaying subscription details to the user
   */
  const activeOrPendingSubscription = computed<UserSubscription | undefined>(() =>
    get(userSubscriptions).find(sub => isSubActive(sub) || isSubPending(sub)),
  );

  watch(loading, (isLoading) => {
    if (!isLoading && get(initialLoading)) {
      set(initialLoading, false);
    }
  });

  watch(error, (newError) => {
    if (newError) {
      logger.error('Subscription fetch error:', newError);
    }
  });

  return {
    activeOrPendingSubscription,
    activeSubscription,
    initialLoading: readonly(initialLoading),
    loading: readonly(loading),
    refresh,
    userSubscriptions: readonly(userSubscriptions) as Readonly<Ref<UserSubscription[]>>,
  };
}
