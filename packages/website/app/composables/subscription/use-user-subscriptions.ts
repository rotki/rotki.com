import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import { type Subscription as UserSubscription, type UserSubscriptions, UserSubscriptionsSchema } from '@rotki/card-payment-common/schemas/subscription';
import { isCancelledButActive, isSubActive, isSubPending, isSubRequestingUpgrade } from '@rotki/card-payment-common/utils/subscription';
import { get } from '@vueuse/shared';
import { useAuthHintCookie, useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
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
  const authHint = useAuthHintCookie();

  const {
    data,
    error,
    pending: loading,
    refresh,
  } = useAsyncData<UserSubscription[] | undefined>(
    'user-subscriptions',
    async () => {
      if (!get(authHint)) {
        return [];
      }

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
      dedupe: 'defer',
      default: () => undefined,
      lazy: true,
      server: false,
    },
  );

  const userSubscriptions = computed<UserSubscription[]>(() => get(data) ?? []);

  /**
   * True until the first fetch settles: the data is shared under its key, so a caller created after
   * the request finished sees it at once, and a refresh keeps the previous list.
   */
  const initialLoading = computed<boolean>(() => get(data) === undefined);

  /**
   * Returns the active subscription (truly active, not pending)
   * Used for operations like payment method management
   */
  const activeSubscription = computed<UserSubscription | undefined>(() =>
    get(userSubscriptions).find(sub => isSubActive(sub)),
  );

  /**
   * Returns active or pending subscription for display purposes
   * Includes active subscriptions, pending subscriptions, and subscriptions requesting an upgrade
   * Used for displaying subscription details to the user
   */
  const activeOrPendingSubscription = computed<UserSubscription | undefined>(() =>
    get(userSubscriptions).find(sub => isSubActive(sub) || isCancelledButActive(sub) || isSubPending(sub) || isSubRequestingUpgrade(sub)),
  );

  watch(error, (newError) => {
    if (newError) {
      logger.error('Subscription fetch error:', newError);
    }
  });

  return {
    activeOrPendingSubscription,
    activeSubscription,
    initialLoading,
    loading: readonly(loading),
    refresh,
    userSubscriptions,
  };
}
