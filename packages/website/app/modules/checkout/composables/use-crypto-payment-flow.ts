import type { DeepReadonly, Ref } from 'vue';
import type { CryptoPayment } from '~/types';
import { set } from '@vueuse/shared';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useCryptoPaymentApi } from '~/modules/checkout/composables/use-crypto-payment-api';
import { usePendingSubscriptionId } from '~/modules/checkout/composables/use-pending-subscription-id';
import { PaymentError } from '~/types/codes';
import { useLogger } from '~/utils/use-logger';

export interface CryptoPaymentParams {
  planId: number;
  currency: string;
  discountCode?: string;
  subscriptionId?: string;
  upgradeSubId?: string;
}

export interface CryptoPaymentResult {
  success: boolean;
  data?: CryptoPayment;
  error?: string;
  isUnverified?: boolean;
  alreadyStarted?: boolean;
}

interface UseCryptoPaymentFlowReturn {
  // State
  paymentData: DeepReadonly<Ref<CryptoPayment | undefined>>;
  loading: DeepReadonly<Ref<boolean>>;

  // Actions
  createPayment: (params: CryptoPaymentParams) => Promise<CryptoPaymentResult>;
  switchPlan: (params: CryptoPaymentParams) => Promise<CryptoPaymentResult>;
  cancelPayment: (upgradeSubId?: string) => Promise<{ success: boolean; error?: string }>;
  markTransactionStarted: (isUpgrade: boolean) => Promise<void>;
  reset: () => void;
}

/**
 * Pure crypto payment flow - handles only crypto-specific API calls.
 * Orchestration (loading plans, error handling, navigation) happens outside.
 */
export function useCryptoPaymentFlow(): UseCryptoPaymentFlowReturn {
  const api = useCryptoPaymentApi();
  const { requestRefresh } = useAccountRefresh();
  const { clearPendingSubscriptionId } = usePendingSubscriptionId();
  const logger = useLogger('crypto-payment-flow');

  const paymentData = ref<CryptoPayment>();
  const loading = ref<boolean>(false);

  function reset(): void {
    set(paymentData, undefined);
    set(loading, false);
  }

  async function createPayment(params: CryptoPaymentParams): Promise<CryptoPaymentResult> {
    const { planId, currency, discountCode, subscriptionId, upgradeSubId } = params;

    set(loading, true);

    try {
      const apiParams = {
        planId,
        cryptocurrencyIdentifier: currency,
        discountCode: discountCode || undefined,
      };

      const result = upgradeSubId
        ? await api.upgradeCryptoSubscription({ ...apiParams, subscriptionId: upgradeSubId })
        : await api.cryptoPayment({ ...apiParams, subscriptionId });

      requestRefresh();

      if (result.isError) {
        return {
          success: false,
          error: result.error.message,
          isUnverified: result.code === PaymentError.UNVERIFIED,
        };
      }

      // Check if transaction already started (existing pending payment)
      if (result.result.transactionStarted) {
        return {
          success: true,
          alreadyStarted: true,
        };
      }

      set(paymentData, result.result);
      return {
        success: true,
        data: result.result,
      };
    }
    catch (error: any) {
      logger.error('Failed to create crypto payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
    finally {
      set(loading, false);
    }
  }

  async function switchPlan(params: CryptoPaymentParams): Promise<CryptoPaymentResult> {
    const { planId, currency, discountCode, subscriptionId, upgradeSubId } = params;

    set(loading, true);

    try {
      const apiParams = {
        planId,
        cryptocurrencyIdentifier: currency,
        discountCode: discountCode || undefined,
      };

      const result = upgradeSubId
        ? await api.switchCryptoUpgradePlan({ ...apiParams, subscriptionId: upgradeSubId })
        : await api.switchCryptoPlan({ ...apiParams, subscriptionId });

      if (result.isError) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      set(paymentData, result.result);
      return {
        success: true,
        data: result.result,
      };
    }
    catch (error: any) {
      logger.error('Failed to switch plan:', error);
      return {
        success: false,
        error: error.message,
      };
    }
    finally {
      set(loading, false);
    }
  }

  async function cancelPayment(upgradeSubId?: string): Promise<{ success: boolean; error?: string }> {
    set(loading, true);

    try {
      const result = upgradeSubId
        ? await api.cancelUpgradeRequest(upgradeSubId)
        : await api.deletePendingPayment();

      if (result.isError) {
        return { success: false, error: result.error.message };
      }

      reset();
      clearPendingSubscriptionId();
      return { success: true };
    }
    catch (error: any) {
      logger.error('Failed to cancel payment:', error);
      return { success: false, error: error.message };
    }
    finally {
      set(loading, false);
    }
  }

  async function markTransactionStarted(isUpgrade: boolean): Promise<void> {
    await api.markTransactionStarted(isUpgrade);
    requestRefresh();
  }

  return {
    paymentData: readonly(paymentData),
    loading: readonly(loading),
    createPayment,
    switchPlan,
    cancelPayment,
    markTransactionStarted,
    reset,
  };
}
