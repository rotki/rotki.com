import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import type { Ref } from 'vue';
import { get } from '@vueuse/shared';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useCryptoPaymentApi } from '~/composables/use-crypto-payment-api';
import { useCryptoPaymentFlowPurchase } from '~/composables/use-crypto-payment-flow-purchase';
import { useCryptoPaymentFlowUpgrade } from '~/composables/use-crypto-payment-flow-upgrade';
import { useCryptoPaymentState } from '~/composables/use-crypto-payment-state';
import { useTiersStore } from '~/store/tiers';
import { assert } from '~/utils/assert';

interface UseCryptoPaymentFlowReturn {
  handlePaymentMethodChange: () => Promise<boolean>;
  markTransactionStarted: () => Promise<void>;
  initialize: () => Promise<boolean>;
  switchToNewPlan: (newPlan: SelectedPlan) => Promise<void>;
}

/**
 * Composable for managing crypto payment business logic and monitoring
 */
export function useCryptoPaymentFlow(
  currency: Ref<string | null>,
  subscriptionId: Ref<string | undefined>,
  discountCode: Ref<string | undefined>,
): UseCryptoPaymentFlowReturn {
  const state = useCryptoPaymentState();
  const api = useCryptoPaymentApi();
  const { requestRefresh } = useAccountRefresh();
  const router = useRouter();
  const { planId } = usePlanIdParam();
  const { upgradeSubId } = useSubscriptionIdParam();
  const tiersStore = useTiersStore();
  const { getSelectedPlanFromId, getAvailablePlans } = tiersStore;

  // Import purchase and upgrade flows
  const purchaseFlow = useCryptoPaymentFlowPurchase();
  const upgradeFlow = useCryptoPaymentFlowUpgrade();

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

  // Set up pausable watcher (Vue 3.5+ native)
  const { pause, resume } = watch(
    [state.selectedPlan, discountCode],
    async ([newPlan, newDiscount]) => {
      if (!newPlan || get(state.loading) || !isDefined(currency)) {
        return;
      }

      const currencyValue = get(currency);
      const subscriptionValue = get(subscriptionId);
      const upgradeSubIdValue = get(upgradeSubId);

      try {
        // Route to appropriate flow
        if (upgradeSubIdValue) {
          await upgradeFlow.switchUpgradePlan({
            planId: newPlan.planId,
            cryptocurrencyIdentifier: currencyValue,
            upgradeSubId: upgradeSubIdValue,
            discountCode: newDiscount,
          });
        }
        else {
          await purchaseFlow.switchPurchasePlan({
            planId: newPlan.planId,
            cryptocurrencyIdentifier: currencyValue,
            subscriptionId: subscriptionValue,
            discountCode: newDiscount,
          });
        }
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
   * Router function to switch to a new plan (purchase/renewal or upgrade)
   */
  async function switchToNewPlan(newPlan: SelectedPlan): Promise<void> {
    const currencyVal = get(currency);
    const subscriptionVal = get(subscriptionId);
    const discountVal = get(discountCode);
    const upgradeSubIdVal = get(upgradeSubId);

    assert(currencyVal, 'Currency must be selected');

    if (upgradeSubIdVal) {
      // Upgrade flow
      await upgradeFlow.switchToNewUpgradePlan(
        {
          plan: newPlan,
          cryptocurrencyIdentifier: currencyVal,
          upgradeSubId: upgradeSubIdVal,
          discountCode: discountVal,
        },
        pause,
        resume,
        updateRoutePlanId,
      );
    }
    else {
      // Purchase/Renewal flow
      await purchaseFlow.switchToNewPurchasePlan(
        {
          plan: newPlan,
          cryptocurrencyIdentifier: currencyVal,
          subscriptionId: subscriptionVal,
          discountCode: discountVal,
        },
        pause,
        resume,
        updateRoutePlanId,
      );
    }
  }

  /**
   * Handle payment method change - routes to appropriate cancellation method
   */
  const handlePaymentMethodChange = async (): Promise<boolean> => {
    state.setLoading(true);

    try {
      const upgradeSubIdVal = get(upgradeSubId);

      // Determine which cancellation method to use
      const response = upgradeSubIdVal
        ? await api.cancelUpgradeRequest(upgradeSubIdVal)
        : await api.deletePendingPayment();

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
    await api.markTransactionStarted(!!get(upgradeSubId));
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

    const upgradeSubIdVal = get(upgradeSubId);
    const discountCodeVal = get(discountCode);

    // Route to appropriate initialization flow
    if (upgradeSubIdVal) {
      await upgradeFlow.initializeUpgradePayment({
        plan,
        cryptocurrencyIdentifier: currencyVal,
        upgradeSubId: upgradeSubIdVal,
        discountCode: discountCodeVal,
      });
    }
    else {
      await purchaseFlow.initializePurchasePayment({
        plan,
        cryptocurrencyIdentifier: currencyVal,
        subscriptionId: get(subscriptionId),
        discountCode: discountCodeVal,
      });
    }

    // Start the watcher after initialization completes
    resume();

    return true;
  };

  return {
    handlePaymentMethodChange,
    markTransactionStarted,
    initialize,
    switchToNewPlan,
  };
}
