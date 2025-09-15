import { get, set } from '@vueuse/core';
import { FetchError } from 'ofetch';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useMainStore } from '~/store';
import { ActionResultResponse, type Subscription, TaskResponse, TaskStatusResponse } from '~/types';
import { assert } from '~/utils/assert';

interface UseSubscriptionReturn {
  cancelUserSubscription: (subscription: Subscription, onProgress?: (status: string) => void) => Promise<void>;
  resumeUserSubscription: (identifier: string) => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const store = useMainStore();
  const { account, cancellationError, resumeError } = storeToRefs(store);
  const { getAccount } = store;
  const { fetchWithCsrf } = useFetchWithCsrf();

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

  const cancelUserSubscription = async (subscription: Subscription, onProgress?: (status: string) => void): Promise<void> => {
    const acc = get(account);
    assert(acc);

    try {
      // Step 1: Start the cancellation task
      const taskResponse = await fetchWithCsrf<TaskResponse>(
        `/webapi/subscription/${subscription.identifier}/`,
        {
          method: 'DELETE',
        },
      );

      const { taskId } = TaskResponse.parse(taskResponse);

      if (onProgress)
        onProgress('pending');

      // Step 2: Poll for task completion
      const pollStatus = async (): Promise<void> => {
        const statusResponse = await fetchWithCsrf<TaskStatusResponse>(
          `/webapi/task/status/${taskId}/`,
        );
        const status = TaskStatusResponse.parse(statusResponse);

        if (onProgress)
          onProgress(status.status);

        if (status.status === 'pending' || status.status === 'in_progress') {
          // Continue polling after 1 second
          await new Promise(resolve => setTimeout(resolve, 1000));
          return pollStatus();
        }

        if (status.status === 'completed') {
          if (status.result) {
            await getAccount();
          }
          else {
            throw new Error('Cancellation completed but result was false');
          }
        }
        else if (status.status === 'failed') {
          throw new Error(status.error || 'Cancellation task failed');
        }
      };

      await pollStatus();
    }
    catch (error: any) {
      let message = error.message;
      if (error instanceof FetchError) {
        if (error.status === 404) {
          message = ActionResultResponse.parse(error.data).message;
        }
        else if (error.status === 202) {
          // This is expected for the initial call, shouldn't happen here
          message = 'Unexpected response format';
        }
      }

      logger.error(error);
      set(cancellationError, message);
    }
  };

  return {
    cancelUserSubscription,
    resumeUserSubscription,
  };
}
