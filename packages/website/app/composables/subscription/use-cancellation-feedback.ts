import { get, set } from '@vueuse/shared';
import { useFetchWithCsrf } from '~/composables/use-fetch-with-csrf';
import { useLogger } from '~/utils/use-logger';

export interface CancellationReasonChoice {
  value: number;
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
  reasons: Readonly<Ref<CancellationReasonChoice[]>>;
  loading: Readonly<Ref<boolean>>;
  modelReason: Ref<number | undefined>;
  modelComment: Ref<string>;
  isOtherReason: (reason: CancellationReasonChoice) => boolean;
  isOtherSelected: ComputedRef<boolean>;
  isValid: ComputedRef<boolean>;
  fetchReasons: () => Promise<void>;
  submitFeedback: (payload: CancellationFeedbackPayload) => Promise<void>;
  reset: () => void;
}

export function useCancellationFeedback(): UseCancellationFeedbackReturn {
  const { fetchWithCsrf } = useFetchWithCsrf();
  const logger = useLogger('cancellation-feedback');

  const reasons = ref<CancellationReasonChoice[]>([]);
  const loading = shallowRef<boolean>(false);
  const modelReason = ref<number>();
  const modelComment = shallowRef<string>('');

  const OTHER_LABEL = 'Other';

  function isOtherReason(reason: CancellationReasonChoice): boolean {
    return reason.label === OTHER_LABEL;
  }

  const isOtherSelected = computed<boolean>(() => {
    const reason = get(modelReason);
    if (!reason)
      return false;

    return get(reasons).some(r => r.value === reason && isOtherReason(r));
  });

  const isValid = computed<boolean>(() => {
    const reason = get(modelReason);
    if (!reason)
      return false;

    return !(get(isOtherSelected) && get(modelComment).trim().length === 0);
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
    set(modelReason, undefined);
    set(modelComment, '');
  }

  return {
    modelComment,
    fetchReasons,
    isOtherReason,
    isOtherSelected,
    isValid,
    loading: readonly(loading),
    reasons: shallowReadonly(reasons),
    reset,
    modelReason,
    submitFeedback,
  };
}
