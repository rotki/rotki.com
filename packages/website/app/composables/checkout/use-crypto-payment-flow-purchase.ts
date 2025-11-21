import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/shared';
import { useCryptoPaymentApi } from '~/composables/checkout/use-crypto-payment-api';
import { useCryptoPaymentState } from '~/composables/checkout/use-crypto-payment-state';
import { useAccountRefresh } from '~/composables/use-app-events';
import { PaymentError } from '~/types/codes';

/**
 * Parameters for initializing a purchase/renewal payment
 */
export interface InitializePurchasePaymentParams {
  plan: SelectedPlan;
  cryptocurrencyIdentifier: string;
  subscriptionId?: string;
  discountCode?: string;
}

/**
 * Parameters for switching purchase/renewal plan (watcher)
 */
export interface SwitchPurchasePlanParams {
  planId: number;
  cryptocurrencyIdentifier: string;
  subscriptionId?: string;
  discountCode?: string;
}

/**
 * Parameters for switching to new purchase/renewal plan (with state update)
 */
export interface SwitchToNewPurchasePlanParams {
  plan: SelectedPlan;
  cryptocurrencyIdentifier: string;
  subscriptionId?: string;
  discountCode?: string;
}

interface UseCryptoPaymentFlowPurchaseReturn {
  initializePurchasePayment: (params: InitializePurchasePaymentParams) => Promise<void>;
  switchPurchasePlan: (params: SwitchPurchasePlanParams) => Promise<void>;
  switchToNewPurchasePlan: (
    params: SwitchToNewPurchasePlanParams,
    pause: () => void,
    resume: () => void,
    updateRoutePlanId: (planId: number) => Promise<void>
  ) => Promise<void>;
}

/**
 * Composable for managing crypto payment purchase/renewal flow
 */
export function useCryptoPaymentFlowPurchase(): UseCryptoPaymentFlowPurchaseReturn {
  const state = useCryptoPaymentState();
  const api = useCryptoPaymentApi();
  const { requestRefresh } = useAccountRefresh();
  const { t } = useI18n({ useScope: 'global' });

  /**
   * Initialize crypto payment for purchase/renewal
   */
  const initializePurchasePayment = async (params: InitializePurchasePaymentParams): Promise<void> => {
    const { plan, cryptocurrencyIdentifier, subscriptionId, discountCode } = params;

    if (!plan || !cryptocurrencyIdentifier) {
      await navigateTo('/products');
      return;
    }

    state.setLoading(true);
    state.setError('');

    try {
      const result = await api.cryptoPayment({
        planId: plan.planId,
        cryptocurrencyIdentifier,
        subscriptionId,
        discountCode,
      });

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
   * Switch to a different purchase/renewal plan (used by watcher)
   */
  const switchPurchasePlan = async (params: SwitchPurchasePlanParams): Promise<void> => {
    const { planId, cryptocurrencyIdentifier, subscriptionId, discountCode } = params;

    if (get(state.planSwitchLoading)) {
      return;
    }

    state.setPlanSwitchLoading(true);
    state.setError('');

    try {
      const response = await api.switchCryptoPlan({
        planId,
        cryptocurrencyIdentifier,
        subscriptionId,
        discountCode,
      });

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
  };

  /**
   * Switch to a new purchase/renewal plan with state management
   */
  const switchToNewPurchasePlan = async (
    params: SwitchToNewPurchasePlanParams,
    pause: () => void,
    resume: () => void,
    updateRoutePlanId: (planId: number) => Promise<void>,
  ): Promise<void> => {
    const { plan, cryptocurrencyIdentifier, subscriptionId, discountCode } = params;

    // Start loading immediately
    state.setPlanSwitchLoading(true);
    state.setError('');

    // Pause watcher to prevent reactive loops
    pause();

    try {
      // 1. Call API first (no optimistic updates)
      const response = await api.switchCryptoPlan({
        planId: plan.planId,
        cryptocurrencyIdentifier,
        subscriptionId,
        discountCode,
      });

      if (response.isError) {
        throw new Error(response.error.message);
      }

      // 2. Update state only after a successful API response
      state.setSelectedPlan(plan);
      await updateRoutePlanId(plan.planId);

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
  };

  return {
    initializePurchasePayment,
    switchPurchasePlan,
    switchToNewPurchasePlan,
  };
}
