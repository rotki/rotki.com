import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { TaskStatusResponse } from '~/types';
import { logger } from '~/utils/use-logger';

interface UseTaskPollingOptions {
  maxAttempts?: number;
  pollInterval?: number;
  onProgress?: (status: string) => void;
}

interface UseTaskPollingReturn {
  pollTaskStatus: (taskId: string, options?: UseTaskPollingOptions) => Promise<TaskStatusResponse>;
}

const DEFAULT_MAX_ATTEMPTS = 60; // 60 attempts
const DEFAULT_POLL_INTERVAL = 3000; // 3 seconds

/**
 * Composable for polling async task status
 * @returns Functions to poll task status until completion
 */
export function useTaskPolling(): UseTaskPollingReturn {
  const { fetchWithCsrf } = useFetchWithCsrf();

  const pollTaskStatus = async (
    taskId: string,
    options: UseTaskPollingOptions = {},
  ): Promise<TaskStatusResponse> => {
    const {
      maxAttempts = DEFAULT_MAX_ATTEMPTS,
      onProgress,
      pollInterval = DEFAULT_POLL_INTERVAL,
    } = options;

    let pollAttempts = 0;

    const pollStatus = async (): Promise<TaskStatusResponse> => {
      pollAttempts++;

      // Check timeout
      if (pollAttempts > maxAttempts) {
        const timeoutMinutes = Math.round((maxAttempts * pollInterval) / 60000);
        throw new Error(`Task timed out after ${timeoutMinutes} minutes`);
      }

      let status: TaskStatusResponse;

      try {
        const statusResponse = await fetchWithCsrf<TaskStatusResponse>(
          `/webapi/task/status/${taskId}/`,
        );
        status = TaskStatusResponse.parse(statusResponse);
      }
      catch (pollError: any) {
        // If polling fails, notify and rethrow
        if (onProgress)
          onProgress('failed');

        logger.error('Failed to poll task status:', pollError);
        throw new Error(`Failed to check task status: ${pollError.message}`);
      }

      // Notify progress
      if (onProgress)
        onProgress(status.status);

      // Continue polling if still pending or in progress
      if (status.status === 'pending' || status.status === 'in_progress') {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        return pollStatus();
      }

      // Return final status (completed or failed)
      return status;
    };

    return pollStatus();
  };

  return {
    pollTaskStatus,
  };
}
