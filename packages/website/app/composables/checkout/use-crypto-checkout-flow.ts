import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get } from '@vueuse/shared';
import { useCheckout } from '~/composables/checkout/use-checkout';
import { useCryptoPaymentApi } from '~/composables/checkout/use-crypto-payment-api';
import { useAccountRefresh } from '~/composables/use-app-events';
import { PaymentError } from '~/types/codes';
import { useLogger } from '~/utils/use-logger';

interface UseCryptoCheckoutFlowReturn {
  initialize: () => Promise<boolean>;
  switchPlan: (newPlan: SelectedPlan) => Promise<void>;
  cancelAndGoBack: () => Promise<boolean>;
  markTransactionStarted: () => Promise<void>;
}

/**
 * Unified crypto checkout flow composable
 * Handles both purchase and upgrade flows using useCheckout for state
 */
export function useCryptoCheckoutFlow(): UseCryptoCheckoutFlowReturn {
  const checkout = useCheckout();
  const api = useCryptoPaymentApi();
  const { requestRefresh } = useAccountRefresh();
  const { t } = useI18n({ useScope: 'global' });
  const logger = useLogger('crypto-checkout-flow');
  const router = useRouter();

  /**
   * Initialize crypto payment (handles both purchase and upgrade)
   */
  async function initialize(): Promise<boolean> {
    // Ensure plans are loaded
    await checkout.refreshAvailablePlans();

    const planId = get(checkout.planId);
    if (!planId) {
      logger.warn('No planId found');
      return false;
    }

    const plan = get(checkout.selectedPlan);
    if (!plan) {
      logger.warn('Plan not found for planId:', planId);
      return false;
    }

    // Set the crypto selected plan
    checkout.setCryptoSelectedPlan(plan);

    const currency = get(checkout.currency);
    if (!currency) {
      logger.warn('No currency selected');
      return false;
    }

    const upgradeSubId = get(checkout.upgradeSubId);
    const subscriptionId = get(checkout.subscriptionId);
    const discountCode = get(checkout.appliedDiscountCode);

    checkout.setLoading(true);
    checkout.clearError();

    try {
      const params = {
        planId: plan.planId,
        cryptocurrencyIdentifier: currency,
        discountCode: discountCode || undefined,
      };

      const result = upgradeSubId
        ? await api.upgradeCryptoSubscription({ ...params, subscriptionId: upgradeSubId })
        : await api.cryptoPayment({ ...params, subscriptionId });

      requestRefresh();

      if (result.isError) {
        const errorMsg = result.code === PaymentError.UNVERIFIED
          ? t('subscription.error.unverified_email')
          : result.error.message;
        checkout.setError(t('subscription.error.payment_failure'), errorMsg);
        return false;
      }

      // Check if transaction already started (existing pending payment)
      if (result.result.transactionStarted) {
        sessionStorage.setItem('payment-completed', 'true');
        await navigateTo({ name: 'checkout-success', query: { crypto: '1' } });
        return true;
      }

      checkout.setCryptoPaymentData(result.result);
      return true;
    }
    catch (error: any) {
      logger.error('Failed to initialize crypto payment:', error);
      checkout.setError(t('subscription.error.payment_failure'), error.message);
      return false;
    }
    finally {
      checkout.setLoading(false);
    }
  }

  /**
   * Switch to a different plan
   */
  async function switchPlan(newPlan: SelectedPlan): Promise<void> {
    const currency = get(checkout.currency);
    const upgradeSubId = get(checkout.upgradeSubId);
    const subscriptionId = get(checkout.subscriptionId);
    const discountCode = get(checkout.appliedDiscountCode);

    if (!currency) {
      return;
    }

    checkout.setPlanSwitchLoading(true);
    checkout.clearError();

    try {
      const params = {
        planId: newPlan.planId,
        cryptocurrencyIdentifier: currency,
        discountCode: discountCode || undefined,
      };

      const result = upgradeSubId
        ? await api.switchCryptoUpgradePlan({ ...params, subscriptionId: upgradeSubId })
        : await api.switchCryptoPlan({ ...params, subscriptionId });

      if (result.isError) {
        throw new Error(result.error.message);
      }

      // Update selected plan in state
      checkout.setCryptoSelectedPlan(newPlan);

      // Update URL with new planId
      const currentRoute = get(router.currentRoute);
      await navigateTo({
        path: currentRoute.path,
        query: { ...currentRoute.query, planId: newPlan.planId.toString() },
      }, { replace: true });

      checkout.setCryptoPaymentData(result.result);
      await nextTick();
    }
    catch (error: any) {
      logger.error('Failed to switch plan:', error);
      checkout.setError(t('subscription.error.payment_failure'), error.message);
    }
    finally {
      checkout.setPlanSwitchLoading(false);
    }
  }

  /**
   * Cancel current payment request and go back
   */
  async function cancelAndGoBack(): Promise<boolean> {
    const upgradeSubId = get(checkout.upgradeSubId);
    const discountCode = get(checkout.appliedDiscountCode);
    const planId = get(checkout.planId);
    const subscriptionId = get(checkout.subscriptionId);

    checkout.setLoading(true);

    try {
      const result = upgradeSubId
        ? await api.cancelUpgradeRequest(upgradeSubId)
        : await api.deletePendingPayment();

      if (result.isError) {
        checkout.setError(t('subscription.error.cancel_failed'), result.error.message);
        return false;
      }

      // Navigate back
      if (upgradeSubId) {
        await navigateTo({ name: 'home-subscription' });
      }
      else {
        await navigateTo({
          name: 'checkout-pay-request-crypto',
          query: {
            planId,
            id: subscriptionId,
            discountCode: discountCode || undefined,
          },
        });
      }

      return true;
    }
    catch (error: any) {
      logger.error('Failed to cancel payment:', error);
      checkout.setError(t('subscription.error.cancel_failed'), error.message);
      return false;
    }
    finally {
      checkout.setLoading(false);
    }
  }

  /**
   * Mark transaction as started (user initiated wallet transaction)
   */
  async function markTransactionStarted(): Promise<void> {
    const upgradeSubId = get(checkout.upgradeSubId);
    await api.markTransactionStarted(!!upgradeSubId);
    requestRefresh();
  }

  return {
    cancelAndGoBack,
    initialize,
    markTransactionStarted,
    switchPlan,
  };
}
