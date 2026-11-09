import type { ResultAsync } from 'plainfp/result-async';
import type { DeepReadonly, Ref } from 'vue';
import type { CryptoPayment } from '~/types';
import { set } from '@vueuse/shared';
import { err } from 'plainfp/result';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useCryptoPaymentApi } from '~/modules/checkout/composables/use-crypto-payment-api';
import { usePendingSubscriptionId } from '~/modules/checkout/composables/use-pending-subscription-id';
import { type PaymentFailure, unexpected } from '~/modules/checkout/utils/payment-failure';
import { nonEmpty } from '~/utils/non-empty';
import { useLogger } from '~/utils/use-logger';

export interface CryptoPaymentParams {
  planId: number;
  currency: string;
  discountCode?: string;
  subscriptionId?: string;
  upgradeSubId?: string;
}

type CryptoPaymentApi = ReturnType<typeof useCryptoPaymentApi>;

interface PaymentRequest {
  regular: CryptoPaymentApi['cryptoPayment'];
  upgrade: CryptoPaymentApi['upgradeCryptoSubscription'];
  /** Logged when a call throws instead of returning a failure. */
  failureLog: string;
  /** Runs once the backend answered, whatever the answer. */
  onAnswer?: () => void;
  /** Leaves out a payment whose transaction already started, which has nothing left to send. */
  skipStarted?: boolean;
}

interface UseCryptoPaymentFlowReturn {
  // State
  paymentData: DeepReadonly<Ref<CryptoPayment | undefined>>;
  loading: DeepReadonly<Ref<boolean>>;

  // Actions
  createPayment: (params: CryptoPaymentParams) => ResultAsync<CryptoPayment, PaymentFailure>;
  switchPlan: (params: CryptoPaymentParams) => ResultAsync<CryptoPayment, PaymentFailure>;
  cancelPayment: (upgradeSubId?: string) => ResultAsync<boolean, PaymentFailure>;
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
  const loading = shallowRef<boolean>(false);

  function reset(): void {
    set(paymentData, undefined);
    set(loading, false);
  }

  async function requestPayment(params: CryptoPaymentParams, request: PaymentRequest): ResultAsync<CryptoPayment, PaymentFailure> {
    const { planId, currency, discountCode, subscriptionId, upgradeSubId } = params;

    set(loading, true);

    try {
      const apiParams = {
        planId,
        cryptocurrencyIdentifier: currency,
        discountCode: nonEmpty(discountCode),
      };

      const result = upgradeSubId
        ? await request.upgrade({ ...apiParams, subscriptionId: upgradeSubId })
        : await request.regular({ ...apiParams, subscriptionId });

      request.onAnswer?.();

      if (result.ok && !(request.skipStarted && result.value.transactionStarted))
        set(paymentData, result.value);

      return result;
    }
    catch (error: unknown) {
      logger.error(request.failureLog, error);
      return err(unexpected(error));
    }
    finally {
      set(loading, false);
    }
  }

  async function createPayment(params: CryptoPaymentParams): ResultAsync<CryptoPayment, PaymentFailure> {
    return requestPayment(params, {
      regular: api.cryptoPayment,
      upgrade: api.upgradeCryptoSubscription,
      failureLog: 'Failed to create crypto payment:',
      onAnswer: requestRefresh,
      skipStarted: true,
    });
  }

  async function switchPlan(params: CryptoPaymentParams): ResultAsync<CryptoPayment, PaymentFailure> {
    return requestPayment(params, {
      regular: api.switchCryptoPlan,
      upgrade: api.switchCryptoUpgradePlan,
      failureLog: 'Failed to switch plan:',
    });
  }

  async function cancelPayment(upgradeSubId?: string): ResultAsync<boolean, PaymentFailure> {
    set(loading, true);

    try {
      const result = upgradeSubId
        ? await api.cancelUpgradeRequest(upgradeSubId)
        : await api.deletePendingPayment();

      if (result.ok) {
        reset();
        clearPendingSubscriptionId();
      }
      return result;
    }
    catch (error: unknown) {
      logger.error('Failed to cancel payment:', error);
      return err(unexpected(error));
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
