import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useLogger } from '~/utils/use-logger';

export interface CancellationReasonChoice {
  key: number;
  label: string;
}

export interface CancellationFeedbackPayload {
  reason: number;
  feedback: string;
}

interface CancellationFeedbackResponse {
  reasons: CancellationReasonChoice[];
}

interface UseCancellationFeedbackReturn {
  reasons: Ref<CancellationReasonChoice[]>;
  loading: Ref<boolean>;
  selectedReason: Ref<number | undefined>;
  comment: Ref<string>;
  isValid: ComputedRef<boolean>;
  fetchReasons: () => Promise<void>;
  submitFeedback: (payload: CancellationFeedbackPayload) => Promise<void>;
  reset: () => void;
}

export function useCancellationFeedback(): UseCancellationFeedbackReturn {
  const { fetchWithCsrf } = useFetchWithCsrf();
  const logger = useLogger('cancellation-feedback');

  const reasons = ref<CancellationReasonChoice[]>([]);
  const loading = ref<boolean>(false);
  const selectedReason = ref<number>();
  const comment = ref<string>('');

  const OTHER_REASON = 7;

  const isValid = computed<boolean>(() => {
    const reason = get(selectedReason);
    if (!reason)
      return false;

    if (reason === OTHER_REASON && get(comment).trim().length === 0)
      return false;

    return true;
  });

  async function fetchReasons(): Promise<void> {
    set(loading, true);
    try {
      const response = await fetchWithCsrf<CancellationFeedbackResponse>(
        '/webapi/2/subscriptions/cancellation-feedback',
      );
      set(reasons, response.reasons);
    }
    catch (error: unknown) {
      logger.error('Failed to fetch cancellation reasons:', error);
    }
    finally {
      set(loading, false);
    }
  }

  async function submitFeedback(payload: CancellationFeedbackPayload): Promise<void> {
    try {
      await fetchWithCsrf('/webapi/2/subscriptions/cancellation-feedback', {
        method: 'POST',
        body: payload,
      });
    }
    catch (error: unknown) {
      logger.error('Failed to submit cancellation feedback:', error);
    }
  }

  function reset(): void {
    set(selectedReason, undefined);
    set(comment, '');
  }

  return {
    comment,
    fetchReasons,
    isValid,
    loading,
    reasons,
    reset,
    selectedReason,
    submitFeedback,
  };
}
