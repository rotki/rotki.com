import { createSharedComposable, useSessionStorage } from '@vueuse/core';
import { set } from '@vueuse/shared';

function usePendingSubscriptionIdInternal() {
  const pendingSubscriptionId = useSessionStorage<string | undefined>('rotki.pending-subscription-id', undefined);

  function setPendingSubscriptionId(id: string | undefined): void {
    set(pendingSubscriptionId, id);
  }

  function clearPendingSubscriptionId(): void {
    set(pendingSubscriptionId, undefined);
  }

  return {
    clearPendingSubscriptionId,
    pendingSubscriptionId,
    setPendingSubscriptionId,
  };
}

export const usePendingSubscriptionId = createSharedComposable(usePendingSubscriptionIdInternal);
