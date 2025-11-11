import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import { type Subscription as UserSubscription, type UserSubscriptions, UserSubscriptionsSchema } from '@rotki/card-payment-common/schemas/subscription';
import { get } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useLogger } from '~/utils/use-logger';

interface UseUserSubscriptionsReturn {
  activeSubscription: ComputedRef<UserSubscription | undefined>;
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

  watch(error, (newError) => {
    if (newError) {
      logger.error('Subscription fetch error:', newError);
    }
  });

  const activeSubscription = computed<UserSubscription | undefined>(() =>
    get(userSubscriptions).find(sub => sub.isActive),
  );

  return {
    activeSubscription,
    loading: readonly(loading),
    refresh,
    userSubscriptions: readonly(userSubscriptions) as Readonly<Ref<UserSubscription[]>>,
  };
}
