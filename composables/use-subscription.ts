import { set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store';
import { ActionResultResponse, type UserSubscription } from '~/types';

interface UseSubscriptionReturn {
  cancelUserSubscription: (sub: UserSubscription) => Promise<void>;
  resumeUserSubscription: (sub: UserSubscription) => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const store = useMainStore();
  const { cancellationError, resumeError } = storeToRefs(store);
  const { getSubscriptions } = store;
  const { fetchWithCsrf } = useFetchWithCsrf();

  const resumeUserSubscription = async (sub: UserSubscription) => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        `/webapi/2/subscriptions/${sub.id}/resume/`,
        {
          method: 'PATCH',
        },
      );
      const data = ActionResultResponse.parse(response);
      if (data.result)
        await getSubscriptions();
    }
    catch (error: any) {
      let message = error.message;
      if (error instanceof FetchError && error.status === 404)
        message = ActionResultResponse.parse(error.data).message;

      logger.error(error);
      set(resumeError, message);
    }
  };

  const cancelUserSubscription = async (sub: UserSubscription): Promise<void> => {
    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        `/webapi/2/subscriptions/${sub.id}/`,
        {
          method: 'DELETE',
        },
      );
      const data = ActionResultResponse.parse(response);
      if (data.result)
        await getSubscriptions();
    }
    catch (error: any) {
      let message = error.message;
      if (error instanceof FetchError && error.status === 404)
        message = ActionResultResponse.parse(error.data).message;

      logger.error(error);
      set(cancellationError, message);
    }
  };

  return {
    cancelUserSubscription,
    resumeUserSubscription,
  };
}
