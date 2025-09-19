import { get, set } from '@vueuse/shared';
import { FetchError } from 'ofetch';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useTaskPolling } from '~/composables/use-task-polling';
import { useMainStore } from '~/store';
import { ActionResultResponse, type Subscription, TaskResponse } from '~/types';
import { assert } from '~/utils/assert';

interface UseSubscriptionReturn {
  cancelUserSubscription: (subscription: Subscription, onProgress?: (status: string) => void) => Promise<void>;
  resumeUserSubscription: (identifier: string, onProgress?: (status: string) => void) => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const store = useMainStore();
  const { account, cancellationError, resumeError } = storeToRefs(store);
  const { getAccount } = store;
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { pollTaskStatus } = useTaskPolling();

  const resumeUserSubscription = async (identifier: string, onProgress?: (status: string) => void): Promise<void> => {
    const acc = get(account);
    assert(acc);

    try {
      // Step 1: Start the resume task
      const taskResponse = await fetchWithCsrf<TaskResponse>(
        `/webapi/subscription/${identifier}/resume/`,
        {
          method: 'PATCH',
        },
      );

      const { taskId } = TaskResponse.parse(taskResponse);

      if (onProgress)
        onProgress('pending');

      // Step 2: Poll for task completion
      const status = await pollTaskStatus(taskId, {
        onProgress,
      });

      // Handle the final status
      if (status.status === 'completed') {
        if (status.result) {
          await getAccount();
        }
        else {
          throw new Error('Resume completed but result was false');
        }
      }
      else if (status.status === 'failed') {
        throw new Error(status.error || 'Resume task failed');
      }
    }
    catch (error: any) {
      // Clean up state on any error
      if (onProgress)
        onProgress('failed');

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
      const status = await pollTaskStatus(taskId, {
        onProgress,
      });

      // Handle the final status
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
    }
    catch (error: any) {
      // Clean up state on any error
      if (onProgress)
        onProgress('failed');

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
