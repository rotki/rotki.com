import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { CryptoPayment, IdleStep, PaymentStep, StepType } from '~/types';
import { createSharedComposable, get, set } from '@vueuse/shared';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { useTiersApi } from '~/composables/tiers/use-tiers-api';
import { logger } from '~/utils/use-logger';

export interface CheckoutError {
  title: string;
  message: string;
}

function useCheckoutInternal() {
  const route = useRoute();
  const { t } = useI18n({ useScope: 'global' });
  const { fetchPaymentBreakdown } = useTiersApi();
  const { getSelectedPlanFromId, availablePlans, pending: plansPending, refresh: refreshAvailablePlans } = useAvailablePlans();

  // ===================
  // Route-derived state (read-only)
  // ===================
  const planId = computed<number | undefined>(() => {
    const id = route.query.planId;
    return id && typeof id === 'string' ? Number(id) : undefined;
  });

  const currency = computed<string | undefined>(() => {
    const curr = route.query.currency;
    return curr && typeof curr === 'string' ? curr : undefined;
  });

  const upgradeSubId = computed<string | undefined>(() => {
    const id = route.query.upgradeSubId;
    return id && typeof id === 'string' ? id : undefined;
  });

  const subscriptionId = computed<string | undefined>(() => {
    const id = route.query.id;
    return id && typeof id === 'string' ? id : undefined;
  });

  const referralCode = computed<string | undefined>(() => {
    const ref = route.query.ref;
    return ref && typeof ref === 'string' ? ref : undefined;
  });

  // ===================
  // Derived flags
  // ===================
  // Crypto mode can be overridden (e.g., for CryptoRequest page before currency is selected)
  const cryptoModeOverride = ref<boolean>(false);
  const isCrypto = computed<boolean>(() => get(cryptoModeOverride) || !!get(currency));
  const isUpgrade = computed<boolean>(() => !!get(upgradeSubId));

  function setCryptoMode(value: boolean): void {
    set(cryptoModeOverride, value);
  }

  // ===================
  // Plan data
  // ===================
  const selectedPlan = computed<SelectedPlan | undefined>(() => {
    const id = get(planId);
    return id ? getSelectedPlanFromId(id) : undefined;
  });

  // ===================
  // Discount code handling
  // ===================
  // Input value (for text field binding)
  const discountCodeInput = ref<string>(String(route.query.discountCode || route.query.ref || ''));

  // Applied value (from URL - source of truth)
  const appliedDiscountCode = computed<string>(() => String(route.query.discountCode || ''));

  // ===================
  // Breakdown data
  // ===================
  const breakdown = ref<PaymentBreakdownResponse>();
  const breakdownLoading = ref<boolean>(false);
  const breakdownFetched = ref<boolean>(false);

  const braintreeToken = computed<string | undefined>(() => get(breakdown)?.braintreeClientToken);

  async function fetchBreakdown(): Promise<void> {
    const id = get(planId);
    if (!id) {
      set(breakdown, undefined);
      return;
    }

    set(breakdownLoading, true);
    try {
      const response = await fetchPaymentBreakdown({
        newPlanId: id,
        isCryptoPayment: get(isCrypto),
        discountCode: get(appliedDiscountCode) || undefined,
      });
      set(breakdown, response);
      set(breakdownFetched, true);
    }
    catch (error) {
      logger.error('Failed to fetch breakdown:', error);
      set(breakdown, undefined);
    }
    finally {
      set(breakdownLoading, false);
    }
  }

  async function applyDiscount(): Promise<void> {
    const code = get(discountCodeInput);
    await navigateTo({
      path: route.path,
      query: {
        ...route.query,
        discountCode: code || undefined,
      },
    });
    await fetchBreakdown();
  }

  // ===================
  // UI State
  // ===================
  const loading = ref<boolean>(false);
  const error = ref<CheckoutError>();
  const step = ref<StepType | IdleStep>('idle');
  const planSwitchLoading = ref<boolean>(false);
  const web3ProcessingLoading = ref<boolean>(false);

  // Computed payment step for UI feedback
  const paymentStep = computed<PaymentStep>(() => {
    const errorVal = get(error);
    const state = get(step);

    if (errorVal) {
      return {
        type: 'failure',
        title: errorVal.title,
        message: errorVal.message,
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

  function setLoading(value: boolean): void {
    set(loading, value);
  }

  function setError(title: string, message: string): void {
    set(error, { title, message });
    set(step, 'idle');
  }

  function clearError(): void {
    set(error, undefined);
    if (get(step) === 'failure') {
      set(step, 'idle');
    }
  }

  function setStep(value: StepType | IdleStep): void {
    set(step, value);
  }

  function setPlanSwitchLoading(value: boolean): void {
    set(planSwitchLoading, value);
  }

  function setWeb3ProcessingLoading(value: boolean): void {
    set(web3ProcessingLoading, value);
  }

  // ===================
  // Crypto-specific state
  // ===================
  const cryptoPaymentData = ref<CryptoPayment>();
  const cryptoSelectedPlan = ref<SelectedPlan>();

  function setCryptoPaymentData(data: CryptoPayment | undefined): void {
    set(cryptoPaymentData, data);
  }

  function setCryptoSelectedPlan(plan: SelectedPlan | undefined): void {
    set(cryptoSelectedPlan, plan);
  }

  // Effective selected plan (crypto flow may override)
  const effectiveSelectedPlan = computed<SelectedPlan | undefined>(() => get(cryptoSelectedPlan) ?? get(selectedPlan));

  // ===================
  // Initialization
  // ===================
  // Fetch breakdown when planId changes (and is present)
  watch(planId, (id) => {
    if (id && !get(breakdownFetched)) {
      fetchBreakdown().catch(error => logger.error('Failed to fetch breakdown:', error));
    }
  }, { immediate: true });

  // Sync discount code input when URL changes externally
  watch(appliedDiscountCode, (code) => {
    set(discountCodeInput, code);
  });

  // ===================
  // Reset
  // ===================
  function reset(): void {
    set(breakdown, undefined);
    set(breakdownFetched, false);
    set(loading, false);
    set(error, undefined);
    set(step, 'idle');
    set(planSwitchLoading, false);
    set(web3ProcessingLoading, false);
    set(cryptoPaymentData, undefined);
    set(cryptoSelectedPlan, undefined);
    set(cryptoModeOverride, false);
  }

  return {
    // Route params (read-only)
    planId,
    currency,
    upgradeSubId,
    subscriptionId,
    referralCode,

    // Flags
    isCrypto,
    isUpgrade,
    setCryptoMode,

    // Plan data
    selectedPlan,
    effectiveSelectedPlan,
    availablePlans,
    plansPending,
    refreshAvailablePlans,

    // Breakdown
    breakdown: readonly(breakdown),
    breakdownLoading: readonly(breakdownLoading),
    braintreeToken,
    fetchBreakdown,

    // Discount
    discountCodeInput,
    appliedDiscountCode,
    applyDiscount,

    // UI State
    loading: readonly(loading),
    error: readonly(error),
    step: readonly(step),
    paymentStep,
    planSwitchLoading: readonly(planSwitchLoading),
    web3ProcessingLoading: readonly(web3ProcessingLoading),
    setLoading,
    setError,
    clearError,
    setStep,
    setPlanSwitchLoading,
    setWeb3ProcessingLoading,

    // Crypto-specific
    cryptoPaymentData: readonly(cryptoPaymentData),
    cryptoSelectedPlan: readonly(cryptoSelectedPlan),
    setCryptoPaymentData,
    setCryptoSelectedPlan,

    // Utilities
    reset,
  };
}

export const useCheckout = createSharedComposable(useCheckoutInternal);
