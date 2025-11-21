import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/shared';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useCryptoPaymentApi } from '~/composables/use-crypto-payment-api';
import { useCryptoPaymentState } from '~/composables/use-crypto-payment-state';
import { PaymentError } from '~/types/codes';

/**
 * Parameters for initializing an upgrade payment
 */
export interface InitializeUpgradePaymentParams {
  plan: SelectedPlan;
  cryptocurrencyIdentifier: string;
  upgradeSubId: string;
  discountCode?: string;
}

/**
 * Parameters for switching upgrade plan (watcher)
 */
export interface SwitchUpgradePlanParams {
  planId: number;
  cryptocurrencyIdentifier: string;
  upgradeSubId: string;
  discountCode?: string;
}

/**
 * Parameters for switching to a new upgrade plan (with state update)
 */
export interface SwitchToNewUpgradePlanParams {
  plan: SelectedPlan;
  cryptocurrencyIdentifier: string;
  upgradeSubId: string;
  discountCode?: string;
}

interface UseCryptoPaymentFlowUpgradeReturn {
  initializeUpgradePayment: (params: InitializeUpgradePaymentParams) => Promise<void>;
  switchUpgradePlan: (params: SwitchUpgradePlanParams) => Promise<void>;
  switchToNewUpgradePlan: (
    params: SwitchToNewUpgradePlanParams,
    pause: () => void,
    resume: () => void,
    updateRoutePlanId: (planId: number) => Promise<void>
  ) => Promise<void>;
}

/**
 * Composable for managing crypto payment upgrade flow
 */
export function useCryptoPaymentFlowUpgrade(): UseCryptoPaymentFlowUpgradeReturn {
  const state = useCryptoPaymentState();
  const api = useCryptoPaymentApi();
  const { requestRefresh } = useAccountRefresh();
  const { t } = useI18n({ useScope: 'global' });

  /**
   * Initialize crypto payment for upgrade
   */
  const initializeUpgradePayment = async (params: InitializeUpgradePaymentParams): Promise<void> => {
    const { plan, cryptocurrencyIdentifier, upgradeSubId, discountCode } = params;

    if (!plan || !cryptocurrencyIdentifier) {
      await navigateTo('/products');
      return;
    }

    state.setLoading(true);
    state.setError('');

    try {
      const result = await api.upgradeCryptoSubscription({
        planId: plan.planId,
        cryptocurrencyIdentifier,
        subscriptionId: upgradeSubId,
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
   * Switch to a different upgrade plan (used by watcher)
   */
  const switchUpgradePlan = async (params: SwitchUpgradePlanParams): Promise<void> => {
    const { planId, cryptocurrencyIdentifier, upgradeSubId, discountCode } = params;

    if (get(state.planSwitchLoading)) {
      return;
    }

    state.setPlanSwitchLoading(true);
    state.setError('');

    try {
      const response = await api.switchCryptoUpgradePlan({
        planId,
        cryptocurrencyIdentifier,
        subscriptionId: upgradeSubId,
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
   * Switch to new upgrade plan with state management
   */
  const switchToNewUpgradePlan = async (
    params: SwitchToNewUpgradePlanParams,
    pause: () => void,
    resume: () => void,
    updateRoutePlanId: (planId: number) => Promise<void>,
  ): Promise<void> => {
    const { plan, cryptocurrencyIdentifier, upgradeSubId, discountCode } = params;

    // Start loading immediately
    state.setPlanSwitchLoading(true);
    state.setError('');

    // Pause watcher to prevent reactive loops
    pause();

    try {
      // 1. Call API first (no optimistic updates)
      const response = await api.switchCryptoUpgradePlan({
        planId: plan.planId,
        cryptocurrencyIdentifier,
        subscriptionId: upgradeSubId,
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
    initializeUpgradePayment,
    switchUpgradePlan,
    switchToNewUpgradePlan,
  };
}
