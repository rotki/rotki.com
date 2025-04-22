import { set } from '@vueuse/core';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { UserPayments } from '~/types/account';

export function useUserPayments() {
  const payments = ref<UserPayments>([]);

  const { fetchWithCsrf } = useFetchWithCsrf();

  async function fetchPayments(): Promise<void> {
    try {
      const response = await fetchWithCsrf<UserPayments>(
        '/webapi/2/payments',
        {
          method: 'GET',
        },
      );

      const parsed = UserPayments.parse(response);
      set(payments, parsed);
    }
    catch (error) {
      logger.error(error);
    }
  }

  return {
    fetchPayments,
    payments,
  };
}
