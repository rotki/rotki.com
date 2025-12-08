import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { ActionResultResponseSchema } from '@rotki/card-payment-common/schemas/api';
import { FetchError } from 'ofetch';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useTaskPolling } from '~/composables/use-task-polling';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';
import { TaskResponse } from '~/types';
import { useLogger } from '~/utils/use-logger';

function getErrorMessage(error: unknown): string {
  let message = 'An unexpected error occurred';

  if (error instanceof FetchError) {
    if (error.status === 404) {
      const parsed = ActionResultResponseSchema.safeParse(error.data);
      if (parsed.success && parsed.data.message) {
        message = parsed.data.message;
      }
    }
    else if (error.status === 202) {
      // This is expected for the initial call, shouldn't happen here
      message = 'Unexpected response format';
    }
  }
  else if (error instanceof Error) {
    message = error.message;
  }

  return message;
}

interface UseSubscriptionReturn {
  cancelUserSubscription: (subscription: UserSubscription, onProgress?: (status: string) => void) => Promise<void>;
  resumeUserSubscription: (identifier: UserSubscription, onProgress?: (status: string) => void) => Promise<void>;
}

export function useSubscription(): UseSubscriptionReturn {
  const { requestRefresh } = useAccountRefresh();
  const subscriptionOpsStore = useSubscriptionOperationsStore();
  const { setError } = subscriptionOpsStore;
  const { fetchWithCsrf } = useFetchWithCsrf();
  const { pollTaskStatus } = useTaskPolling();
  const logger = useLogger('subscription');

  async function processSubscriptionTask(
    url: string,
    method: 'PATCH' | 'DELETE',
    taskName: string,
    onProgress?: (status: string) => void,
  ): Promise<void> {
    let errorMessage: string | undefined;

    try {
      onProgress?.('pending');
      const taskResponse = await fetchWithCsrf<TaskResponse>(url, { method });
      const { taskId } = TaskResponse.parse(taskResponse);

      const status = await pollTaskStatus(taskId, { onProgress });

      if (status.status === 'completed' && status.result) {
        requestRefresh();
        return;
      }

      errorMessage = status.status === 'completed'
        ? `${taskName} completed but result was false`
        : status.error || `${taskName} task failed`;
    }
    catch (error: unknown) {
      errorMessage = getErrorMessage(error);
    }

    // Handle any error that occurred
    if (errorMessage) {
      onProgress?.('failed');
      logger.error(`${taskName} failed:`, errorMessage);
      setError(errorMessage);
    }
  }

  const resumeUserSubscription = async ({ id }: UserSubscription, onProgress?: (status: string) => void): Promise<void> => {
    await processSubscriptionTask(
      `/webapi/2/subscriptions/${id}/resume/`,
      'PATCH',
      'Resume subscription',
      onProgress,
    );
  };

  const cancelUserSubscription = async ({ id }: UserSubscription, onProgress?: (status: string) => void): Promise<void> => {
    await processSubscriptionTask(
      `/webapi/2/subscriptions/${id}/`,
      'DELETE',
      'Cancel subscription',
      onProgress,
    );
  };

  return {
    cancelUserSubscription,
    resumeUserSubscription,
  };
}
