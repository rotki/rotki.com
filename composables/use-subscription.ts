import { get, set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { useMainStore } from '~/store';
import { ActionResultResponse, type Subscription } from '~/types';
import { fetchWithCsrf } from '~/utils/api';
import { assert } from '~/utils/assert';

interface UseSubscriptionReturn {
  cancelUserSubscription: (subscription: Subscription) => Promise<void>;
  resumeUserSubscription: (identifier: string) => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const store = useMainStore();
  const { account, cancellationError, resumeError } = storeToRefs(store);
  const { getAccount } = store;

  const resumeUserSubscription = async (identifier: string) => {
    const acc = get(account);
    assert(acc);

    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        `/webapi/subscription/${identifier}/resume/`,
        {
          method: 'PATCH',
        },
      );
      const data = ActionResultResponse.parse(response);
      if (data.result)
        await getAccount();
    }
    catch (error: any) {
      let message = error.message;
      if (error instanceof FetchError && error.status === 404)
        message = ActionResultResponse.parse(error.data).message;

      logger.error(error);
      set(resumeError, message);
    }
  };

  const cancelUserSubscription = async (subscription: Subscription): Promise<void> => {
    const acc = get(account);
    assert(acc);

    try {
      const response = await fetchWithCsrf<ActionResultResponse>(
        `/webapi/subscription/${subscription.identifier}/`,
        {
          method: 'DELETE',
        },
      );
      const data = ActionResultResponse.parse(response);
      if (data.result)
        await getAccount();
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
