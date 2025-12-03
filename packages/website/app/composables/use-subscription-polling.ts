import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { Ref } from 'vue';
import { get, useIntervalFn } from '@vueuse/shared';

interface UseSubscriptionPollingReturn {
  pause: () => void;
  resume: () => void;
  isActive: Ref<boolean>;
}

interface UseSubscriptionPollingOptions {
  pendingSubscriptions: Ref<UserSubscription[]>;
  refreshCallback: () => Promise<void>;
  intervalMs?: number;
}

/**
 * Composable for polling subscription updates when there are pending subscriptions
 * Automatically starts/stops polling based on pending subscription state
 */
export function useSubscriptionPolling({
  intervalMs = 30000,
  pendingSubscriptions,
  refreshCallback,
}: UseSubscriptionPollingOptions): UseSubscriptionPollingReturn {
  const { isActive, pause, resume } = useIntervalFn(
    () => {
      refreshCallback().catch(() => {});
    },
    intervalMs,
  );

  // Watch for pending subscriptions and adjust polling accordingly
  watch(pendingSubscriptions, (pending) => {
    if (pending.length === 0) {
      pause();
    }
    else if (!get(isActive)) {
      resume();
    }
  });

  // Cleanup on unmount
  onUnmounted(() => {
    pause();
  });

  return {
    isActive,
    pause,
    resume,
  };
}
