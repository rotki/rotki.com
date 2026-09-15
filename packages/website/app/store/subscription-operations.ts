import type { SubscriptionActionType } from '~/components/account/home/subscription-table/types';
import { set } from '@vueuse/shared';
import { defineStore } from 'pinia';

/** Unified state for the subscription operation currently in progress, with its actions. */
function subscriptionOperationsStore() {
  const operationType = ref<SubscriptionActionType>();
  const inProgress = ref<boolean>(false);
  const status = ref<string>();
  const error = ref<string>();

  function setOperationType(type: SubscriptionActionType | undefined): void {
    set(operationType, type);
  }

  function setInProgress(value: boolean): void {
    set(inProgress, value);
  }

  function setStatus(value: string): void {
    set(status, value);
  }

  function setError(value: string): void {
    set(error, value);
  }

  function startOperation(type: SubscriptionActionType): void {
    set(operationType, type);
    set(inProgress, true);
    set(status, undefined);
    set(error, undefined);
  }

  function clearOperation(): void {
    set(operationType, undefined);
    set(inProgress, false);
    set(status, undefined);
    set(error, undefined);
  }

  return {
    clearOperation,
    error,
    inProgress,
    operationType,
    setError,
    setInProgress,
    setOperationType,
    setStatus,
    startOperation,
    status,
  };
}

export const useSubscriptionOperationsStore = defineStore('subscription-operations', subscriptionOperationsStore);
