import type { SubscriptionActionType } from '~/components/account/home/subscription-table/types';
import { set } from '@vueuse/shared';
import { defineStore } from 'pinia';

export const useSubscriptionOperationsStore = defineStore('subscription-operations', () => {
  // Unified operation state
  const operationType = ref<SubscriptionActionType>();
  const inProgress = ref<boolean>(false);
  const status = ref<string>();
  const error = ref<string>();

  // Actions
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
});
