import { set } from '@vueuse/shared';
import { defineStore } from 'pinia';

export const useSubscriptionOperationsStore = defineStore('subscription-operations', () => {
  // State
  const cancellationError = ref<string>('');
  const cancellationStatus = ref<string>('');
  const cancelling = ref<boolean>(false);
  const resumeError = ref<string>('');
  const resumeStatus = ref<string>('');
  const resuming = ref<boolean>(false);

  // Actions
  function setCancellationError(error: string): void {
    set(cancellationError, error);
  }

  function setResumeError(error: string): void {
    set(resumeError, error);
  }

  function setCancellationStatus(status: string): void {
    set(cancellationStatus, status);
  }

  function setResumeStatus(status: string): void {
    set(resumeStatus, status);
  }

  function setCancelling(value: boolean): void {
    set(cancelling, value);
  }

  function setResuming(value: boolean): void {
    set(resuming, value);
  }

  function clearCancellationState(): void {
    set(cancellationError, '');
    set(cancellationStatus, '');
    set(cancelling, false);
  }

  function clearResumeState(): void {
    set(resumeError, '');
    set(resumeStatus, '');
    set(resuming, false);
  }

  return {
    cancellationError,
    cancellationStatus,
    cancelling,
    clearCancellationState,
    clearResumeState,
    resumeError,
    resumeStatus,
    resuming,
    setCancellationError,
    setCancellationStatus,
    setCancelling,
    setResumeError,
    setResumeStatus,
    setResuming,
  };
});
