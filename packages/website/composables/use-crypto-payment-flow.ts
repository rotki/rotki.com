import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { Ref } from 'vue';
import { pausableWatch } from '@vueuse/core';
import { get } from '@vueuse/shared';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useCryptoPaymentApi } from '~/composables/use-crypto-payment-api';
import { useCryptoPaymentState } from '~/composables/use-crypto-payment-state';
import { useTiersStore } from '~/store/tiers';
import { PaymentError } from '~/types/codes';
import { assert } from '~/utils/assert';

/**
 * Composable for managing crypto payment business logic and monitoring
 */
export function useCryptoPaymentFlow(
  currency: Ref<string | null>,
  subscriptionId: Ref<string | undefined>,
  discountCode: Ref<string | undefined>,
) {
  const state = useCryptoPaymentState();
  const api = useCryptoPaymentApi();
  const { requestRefresh } = useAccountRefresh();
  const { t } = useI18n({ useScope: 'global' });
  const router = useRouter();
  const { planId } = usePlanIdParam();
  const tiersStore = useTiersStore();
  const { getSelectedPlanFromId, getAvailablePlans } = tiersStore;

  /**
   * Update the route planId without triggering reactive queries
   */
  const updateRoutePlanId = async (planId: number): Promise<void> => {
    const currentRoute = get(router.currentRoute);
    await navigateTo({
      path: currentRoute.path,
      query: {
        ...currentRoute.query,
        planId: planId.toString(),
      },
    }, { replace: true });
  };

  // Set up pausable watcher initially paused
  const { pause, resume } = pausableWatch(
    [state.selectedPlan, discountCode],
    async ([newPlan, newDiscount]) => {
      if (!newPlan || get(state.loading) || !isDefined(currency)) {
        return;
      }

      const currencyValue = get(currency);
      const subscriptionValue = get(subscriptionId);

      try {
        await switchPlan(newPlan, currencyValue, subscriptionValue, newDiscount);
      }
      catch (error: any) {
        state.setError(error.message);
      }
    },
    {
      // Don't trigger immediately and start paused
      immediate: false,
    },
  );

  // Start paused
  pause();

  /**
   * Initialize crypto payment
   */
  const initializePayment = async (
    plan: SelectedPlan,
    currencyId: string,
    subscriptionId: string | undefined,
    discountCode: string | undefined,
  ): Promise<void> => {
    if (!plan || !currencyId) {
      await navigateTo('/products');
      return;
    }

    state.setLoading(true);
    state.setError('');

    try {
      const result = await api.cryptoPayment(
        plan.planId,
        currencyId,
        subscriptionId,
        discountCode,
      );

      requestRefresh();

      if (result.isError) {
        const errorMsg = result.code === PaymentError.UNVERIFIED
          ? t('subscription.error.unverified_email')
          : result.error.message;
        state.setError(errorMsg);
      }
      else if (result.result.transactionStarted) {
        await navigateTo('/home/subscription');
      }
      else {
        state.setPaymentData(result.result);
      }
    }
    finally {
      state.setLoading(false);
    }
  };

  /**
   * Switch to a different plan
   */
  async function switchPlan(
    plan: SelectedPlan | undefined,
    currencyId: string | undefined,
    subscriptionId: string | undefined,
    discountCode: string | undefined,
  ): Promise<void> {
    if (!plan || get(state.planSwitchLoading)) {
      return;
    }

    assert(currencyId, 'Currency must be selected');

    state.setPlanSwitchLoading(true);
    state.setError('');

    try {
      const response = await api.switchCryptoPlan(
        plan.planId,
        currencyId,
        subscriptionId,
        discountCode,
      );

      if (!response.isError) {
        state.setPaymentData(response.result);
        // Wait for reactive updates to propagate to DOM
        await nextTick();
        state.setPlanSwitchLoading(false);
      }
      else {
        state.setError(response.error.message);
        state.setPlanSwitchLoading(false);
      }
    }
    catch (error: any) {
      state.setError(error.message);
      state.setPlanSwitchLoading(false);
    }
    // Removed finally block - loading is now managed explicitly
  }

  /**
   * Simplified switch plan method that uses reactive refs internally
   */
  async function switchToNewPlan(newPlan: SelectedPlan): Promise<void> {
    const currencyVal = get(currency);
    const subscriptionVal = get(subscriptionId);
    const discountVal = get(discountCode);

    assert(currencyVal, 'Currency must be selected');

    // Start loading immediately
    state.setPlanSwitchLoading(true);
    state.setError('');

    // Pause watcher to prevent reactive loops
    pause();

    try {
      // 1. Call API first (no optimistic updates)
      const response = await api.switchCryptoPlan(
        newPlan.planId,
        currencyVal,
        subscriptionVal,
        discountVal,
      );

      if (response.isError) {
        throw new Error(response.error.message);
      }

      // 2. Update state only after successful API response
      state.setSelectedPlan(newPlan);
      await updateRoutePlanId(newPlan.planId);

      // 3. Set payment data and wait for DOM updates
      state.setPaymentData(response.result);
      await nextTick();

      // 4. Clear loading only after everything is updated
      state.setPlanSwitchLoading(false);
    }
    catch (error: any) {
      // No rollback needed since no optimistic changes were made
      state.setError(error.message);
      state.setPlanSwitchLoading(false);
      throw error;
    }
    finally {
      // Resume watcher after everything completes
      resume();
    }
  }

  /**
   * Handle payment method change
   */
  const handlePaymentMethodChange = async (): Promise<boolean> => {
    state.setLoading(true);

    try {
      const response = await api.deletePendingPayment();

      if (!response.isError) {
        return true;
      }
      else {
        state.setError(response.error.message);
        return false;
      }
    }
    finally {
      state.setLoading(false);
    }
  };

  /**
   * Mark transaction as started
   */
  const markTransactionStarted = async (): Promise<void> => {
    await api.markTransactionStarted();
    requestRefresh();
  };

  /**
   * Initialize payment flow with reactive monitoring
   * @returns true if initialization is successful, false if should navigate away
   */
  const initialize = async (): Promise<boolean> => {
    // Load plans first
    await getAvailablePlans();

    // Get selected plan from planId
    const planIdVal = get(planId);
    if (!planIdVal) {
      return false;
    }

    const plan = getSelectedPlanFromId(planIdVal);
    if (!plan) {
      return false;
    }

    // Set the selected plan in state
    state.setSelectedPlan(plan);

    const currencyVal = get(currency);
    if (!currencyVal) {
      return false;
    }

    // Initial payment setup
    await initializePayment(plan, currencyVal, get(subscriptionId), get(discountCode));

    // Start the watcher after initialization completes
    resume();

    return true;
  };

  return {
    initializePayment,
    handlePaymentMethodChange,
    markTransactionStarted,
    initialize,
    switchToNewPlan,
  };
}
