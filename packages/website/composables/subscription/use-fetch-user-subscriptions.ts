import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import { type UserSubscriptions, UserSubscriptionsSchema } from '@rotki/card-payment-common/schemas/subscription';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';

/**
 * Direct API service composable for user subscriptions
 * Use this for middleware and guards that need direct API access
 */
export function useFetchUserSubscriptions() {
  const { fetchWithCsrf } = useFetchWithCsrf();

  async function fetchUserSubscriptions(): Promise<UserSubscriptions> {
    const response = await fetchWithCsrf<ApiResponse<UserSubscriptions>>(
      '/webapi/2/history/subscriptions',
      {
        method: 'GET',
      },
    );

    return UserSubscriptionsSchema.parse(response.result);
  }

  return {
    fetchUserSubscriptions,
  };
}
