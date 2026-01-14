import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { get, set } from '@vueuse/shared';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { useTiersApi } from '~/composables/tiers/use-tiers-api';
import { logger } from '~/utils/use-logger';

export interface CheckoutError {
  title: string;
  message: string;
}

export function useCheckout() {
  const router = useRouter();
  const { t } = useI18n({ useScope: 'global' });
  const { fetchPaymentBreakdown } = useTiersApi();
  const { getSelectedPlanFromId, availablePlans, pending: plansPending, refresh: refreshAvailablePlans, execute: ensureAvailablePlans } = useAvailablePlans();

  function getCurrentRoute(): RouteLocationNormalizedLoaded {
    return router.currentRoute.value;
  }

  // ===================
  // Route-derived state (read-only)
  // ===================
  const planId = computed<number | undefined>(() => {
    const id = getCurrentRoute().query.planId;
    return id && typeof id === 'string' ? Number(id) : undefined;
  });

  const currency = computed<string | undefined>(() => {
    const curr = getCurrentRoute().query.currency;
    return curr && typeof curr === 'string' ? curr : undefined;
  });

  const upgradeSubId = computed<string | undefined>(() => {
    const id = getCurrentRoute().query.upgradeSubId;
    return id && typeof id === 'string' ? id : undefined;
  });

  const subscriptionId = computed<string | undefined>(() => {
    const id = getCurrentRoute().query.id;
    return id && typeof id === 'string' ? id : undefined;
  });

  const referralCode = computed<string | undefined>(() => {
    const ref = getCurrentRoute().query.ref;
    return ref && typeof ref === 'string' ? ref : undefined;
  });

  // ===================
  // Derived flags
  // ===================
  // Crypto mode is derived from route (crypto pages) or currency in URL
  const isCrypto = computed<boolean>(() => {
    const routeName = getCurrentRoute().name?.toString() ?? '';
    return routeName.includes('crypto') || !!get(currency);
  });
  const isUpgrade = computed<boolean>(() => !!get(upgradeSubId));

  // ===================
  // Plan data (persists across navigations via useState)
  // ===================
  const selectedPlan = useState<SelectedPlan | undefined>('checkout-selected-plan');

  function setSelectedPlan(plan: SelectedPlan | undefined): void {
    set(selectedPlan, plan);
  }

  // Initialize selectedPlan from URL when planId changes
  watch(planId, (id) => {
    if (id) {
      const plan = getSelectedPlanFromId(id);
      if (plan) {
        set(selectedPlan, plan);
      }
    }
  }, { immediate: true });

  // ===================
  // Discount code handling
  // ===================
  // Input value (for text field binding)
  const discountCodeInput = ref<string>(String(getCurrentRoute().query.discountCode || getCurrentRoute().query.ref || ''));

  // Applied value (from URL - source of truth)
  const appliedDiscountCode = computed<string>(() => String(getCurrentRoute().query.discountCode || ''));

  // ===================
  // Breakdown data (persists across navigations via useState)
  // ===================
  const breakdown = useState<PaymentBreakdownResponse | undefined>('checkout-breakdown');
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
    const currentRoute = getCurrentRoute();
    await navigateTo({
      path: currentRoute.path,
      query: {
        ...currentRoute.query,
        discountCode: code || undefined,
      },
    });
    await fetchBreakdown();
  }

  // ===================
  // UI State (error persists across navigations via useState)
  // ===================
  const loading = ref<boolean>(false);
  const error = useState<CheckoutError | undefined>('checkout-error');

  function setLoading(value: boolean): void {
    set(loading, value);
  }

  function setError(title: string, message: string): void {
    set(error, { title, message });
  }

  function clearError(): void {
    set(error, undefined);
  }

  // ===================
  // Initialization state (shared by all payment flows)
  // ===================
  let initPromise: Promise<boolean> | null = null;
  const initialized = ref<boolean>(false);

  // ===================
  // Plan switching state (shared by all payment flows)
  // ===================
  const planSwitchLoading = ref<boolean>(false);

  // ===================
  // Reset (clears useState persisted state)
  // ===================
  function reset(): void {
    set(selectedPlan, undefined);
    set(breakdown, undefined);
    set(breakdownFetched, false);
    set(initialized, false);
    set(planSwitchLoading, false);
    set(loading, false);
    set(error, undefined);
  }

  // ===================
  // Initialization (shared by all payment flows)
  // ===================

  /**
   * Ensures plans and breakdown are loaded.
   * Uses dedupe-aware fetching to avoid duplicate requests.
   * Safe to call multiple times - returns cached promise if in progress.
   * @returns true if initialization succeeded (plan selected), false otherwise
   */
  async function ensureInitialized(): Promise<boolean> {
    // Already initialized
    if (get(initialized)) {
      return !!get(selectedPlan);
    }

    // Initialization in progress - return existing promise
    if (initPromise) {
      return initPromise;
    }

    initPromise = performInitialization();
    try {
      const result = await initPromise;
      if (result) {
        set(initialized, true);
      }
      return result;
    }
    finally {
      initPromise = null;
    }
  }

  async function performInitialization(): Promise<boolean> {
    const needsPlans = !get(availablePlans)?.length;
    const needsBreakdown = !get(breakdown);

    if (needsPlans || needsBreakdown) {
      const promises: Promise<void>[] = [];
      if (needsPlans) {
        promises.push(ensureAvailablePlans());
      }
      if (needsBreakdown) {
        promises.push(fetchBreakdown());
      }
      await Promise.all(promises);
    }

    return !!get(selectedPlan);
  }

  // ===================
  // Plan switching (shared by all payment flows)
  // ===================

  /**
   * Updates the selected plan and URL, then fetches new breakdown.
   * @returns the new breakdown data or undefined on error
   */
  async function switchPlan(newPlan: SelectedPlan): Promise<boolean> {
    set(planSwitchLoading, true);
    clearError();

    try {
      setSelectedPlan(newPlan);

      // Update URL with new planId
      const currentRoute = getCurrentRoute();
      await navigateTo({
        path: currentRoute.path,
        query: { ...currentRoute.query, planId: newPlan.planId.toString() },
      }, { replace: true });

      await fetchBreakdown();
      return true;
    }
    catch (error_: any) {
      logger.error('Failed to switch plan:', error_);
      setError(t('subscription.error.payment_failure'), error_.message);
      return false;
    }
    finally {
      set(planSwitchLoading, false);
    }
  }

  watch(appliedDiscountCode, (code) => {
    set(discountCodeInput, code);
  });

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

    // Initialization (shared by all payment flows)
    ensureInitialized,

    // Plan data
    selectedPlan: readonly(selectedPlan),
    setSelectedPlan,
    availablePlans,
    plansPending,
    ensureAvailablePlans, // Dedupe-aware - use for initialization
    refreshAvailablePlans, // Forces re-fetch - use when explicitly needing fresh data

    // Plan switching (shared by all payment flows)
    switchPlan,
    planSwitchLoading: readonly(planSwitchLoading),

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
    setLoading,
    setError,
    clearError,

    // Utilities
    reset,
  };
}

export type UseCheckoutReturn = ReturnType<typeof useCheckout>;
