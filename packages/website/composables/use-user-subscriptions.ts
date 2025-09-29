import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import { type Subscription as UserSubscription, type UserSubscriptions, UserSubscriptionsSchema } from '@rotki/card-payment-common/schemas/subscription';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';

interface UseUserSubscriptionsReturn {
  loading: Readonly<Ref<boolean>>;
  refresh: () => Promise<void>;
  userSubscriptions: Readonly<Ref<UserSubscription[]>>;
}

export function useUserSubscriptions(): UseUserSubscriptionsReturn {
  const { fetchWithCsrf } = useFetchWithCsrf();

  const {
    data: userSubscriptions,
    error,
    execute,
    pending: loading,
    refresh,
  } = useLazyAsyncData<UserSubscription[]>(
    'user-subscriptions',
    async () => {
      const response = await fetchWithCsrf<ApiResponse<UserSubscriptions>>(
        '/webapi/2/history/subscriptions',
        {
          method: 'GET',
        },
      );
      return UserSubscriptionsSchema.parse(response.result);
    },
    {
      default: () => [] satisfies UserSubscription[],
      immediate: false,
    },
  );

  watch(error, (newError) => {
    if (newError) {
      logger.error('Failed to fetch subscriptions:', newError);
    }
  });

  onBeforeMount(execute);

  return {
    loading: readonly(loading),
    refresh,
    userSubscriptions: readonly(userSubscriptions) as Readonly<Ref<UserSubscription[]>>,
  };
}
