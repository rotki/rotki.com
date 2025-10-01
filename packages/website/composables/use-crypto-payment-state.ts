import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { CryptoPayment, IdleStep, PaymentStep, StepType } from '~/types';
import { get, set } from '@vueuse/shared';

/**
 * Shared composable for crypto payment state management
 * Uses createSharedComposable to share state across components
 * within the same payment flow
 */
export const useCryptoPaymentState = createSharedComposable(() => {
  // Core payment state
  const loading = ref<boolean>(false);
  const planSwitchLoading = ref<boolean>(false);
  const web3ProcessingLoading = ref<boolean>(false);
  const cryptoPaymentData = ref<CryptoPayment>();
  const selectedPlan = ref<SelectedPlan>();
  const errorMessage = ref<string>('');
  const paymentState = ref<StepType | IdleStep>('idle');

  // Get i18n outside of computed
  const { t } = useI18n({ useScope: 'global' });

  // Computed payment step for UI feedback
  const paymentStep = computed<PaymentStep>(() => {
    const message = get(errorMessage);
    const state = get(paymentState);

    if (message) {
      return {
        type: 'failure',
        title: t('subscription.error.payment_failure'),
        message,
        closeable: true,
      };
    }

    if (state === 'pending') {
      return {
        type: 'pending',
        title: t('subscription.progress.payment_progress'),
        message: t('subscription.progress.payment_progress_message'),
      };
    }

    if (state === 'success') {
      return { type: 'success' };
    }

    return { type: 'idle' };
  });

  // State setters with validation
  const setLoading = (value: boolean): void => {
    set(loading, value);
  };

  const setPaymentData = (data: CryptoPayment | undefined): void => {
    set(cryptoPaymentData, data);
  };

  const setError = (message: string): void => {
    set(errorMessage, message);
    if (message) {
      set(paymentState, 'idle');
    }
  };

  const setPaymentState = (state: StepType | IdleStep): void => {
    set(paymentState, state);
  };

  const setPlanSwitchLoading = (value: boolean): void => {
    set(planSwitchLoading, value);
  };

  const setWeb3ProcessingLoading = (value: boolean): void => {
    set(web3ProcessingLoading, value);
  };

  const setSelectedPlan = (plan: SelectedPlan | undefined): void => {
    set(selectedPlan, plan);
  };

  // Reset function for cleanup
  const reset = (): void => {
    set(loading, false);
    set(planSwitchLoading, false);
    set(web3ProcessingLoading, false);
    set(cryptoPaymentData, undefined);
    set(selectedPlan, undefined);
    set(errorMessage, '');
    set(paymentState, 'idle');
  };

  return {
    // Read-only state
    loading: readonly(loading),
    planSwitchLoading: readonly(planSwitchLoading),
    web3ProcessingLoading: readonly(web3ProcessingLoading),
    cryptoPaymentData: readonly(cryptoPaymentData),
    selectedPlan: readonly(selectedPlan),
    errorMessage,
    paymentState,
    paymentStep,

    // State modifiers
    setLoading,
    setPlanSwitchLoading,
    setWeb3ProcessingLoading,
    setPaymentData,
    setSelectedPlan,
    setError,
    setPaymentState,
    reset,
  };
});
