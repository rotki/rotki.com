import type { ApiResponse } from '@rotki/card-payment-common/schemas/api';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { type UserPayment, UserPayments } from '~/types/account';
import { logger } from '~/utils/use-logger';

interface UseUserPaymentsReturn {
  loading: Readonly<Ref<boolean>>;
  refresh: () => Promise<void>;
  userPayments: Readonly<Ref<UserPayment[]>>;
}

export function useUserPayments(): UseUserPaymentsReturn {
  const { fetchWithCsrf } = useFetchWithCsrf();

  const {
    data: userPayments,
    error,
    execute,
    pending: loading,
    refresh,
  } = useLazyAsyncData<UserPayment[]>(
    'user-payments',
    async () => {
      const response = await fetchWithCsrf<ApiResponse<UserPayments>>(
        '/webapi/2/history/payments/',
        {
          method: 'GET',
        },
      );
      return UserPayments.parse(response.result);
    },
    {
      default: () => [] satisfies UserPayment[],
      immediate: false,
    },
  );

  watch(error, (newError) => {
    if (newError) {
      logger.error('Failed to fetch payments:', newError);
    }
  });

  onBeforeMount(execute);

  return {
    loading: readonly(loading),
    refresh,
    userPayments: readonly(userPayments) as Readonly<Ref<UserPayment[]>>,
  };
}
