import type { Ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { PendingTx } from '~/types';
import { isSubPending, isSubRequestingUpgrade } from '@rotki/card-payment-common';
import {
  PaymentProvider,
  type Subscription as UserSubscription,
} from '@rotki/card-payment-common/schemas/subscription';
import { get, set } from '@vueuse/shared';
import { useCryptoPaymentApi } from '~/modules/checkout/composables/use-crypto-payment-api';
import { usePendingTx } from '~/modules/checkout/composables/use-pending-tx';
import { useLogger } from '~/utils/use-logger';

interface UseSubscriptionCryptoPaymentOptions {
  renewableSubscriptions: Ref<UserSubscription[]>;
}

interface UseSubscriptionCryptoPaymentReturn {
  pendingTx: Ref<PendingTx | null>;
  pendingPaymentCurrency: Ref<string | undefined>;
  renewLink: Ref<{ path: string; query: Record<string, string> }>;
  isCryptoPaymentPending: (subscription: UserSubscription) => boolean;
  shouldShowPaymentDetail: (subscription: UserSubscription) => boolean;
  getBlockExplorerLink: (pendingTx: PendingTx) => RouteLocationRaw;
}

// Module-level state to prevent duplicate API calls across component instances
// This is NOT reactive - it's just for deduplication
let pendingFetchSubId: string | undefined;
let fetchInProgress = false;

export function useSubscriptionCryptoPayment({
  renewableSubscriptions,
}: UseSubscriptionCryptoPaymentOptions): UseSubscriptionCryptoPaymentReturn {
  const logger = useLogger('subscription-crypto-payment');
  const pendingTx = usePendingTx();
  const paymentApi = useCryptoPaymentApi();

  // Use useState for reactive shared state across components
  const pendingPaymentCurrency = useState<string | undefined>('pending-payment-currency', () => undefined);

  // Extract just the first subscription ID
  const firstRenewableSubId = computed<string | undefined>(() => get(renewableSubscriptions)[0]?.id);

  /**
   * Get the link to renew a subscription with crypto payment
   */
  const renewLink = computed<{ path: string; query: Record<string, string> }>(() => {
    const link: { path: string; query: Record<string, string> } = {
      path: '/checkout/pay/request-crypto',
      query: {},
    };

    const subs = get(renewableSubscriptions);

    const sub = subs[0];
    if (sub) {
      link.query = {
        id: sub.id,
        planId: sub.planId?.toString() ?? '',
      };
    }

    const currency = get(pendingPaymentCurrency);
    if (currency) {
      link.query = {
        ...link.query,
        currency,
      };
    }

    return link;
  });

  /**
   * Fetch pending payment currency - only if not already fetched for this subscription
   */
  async function fetchPendingCurrency(subId: string): Promise<void> {
    // Synchronous check to prevent race conditions
    if (pendingFetchSubId === subId || fetchInProgress) {
      return;
    }

    // Set flags synchronously before async operation
    fetchInProgress = true;
    pendingFetchSubId = subId;

    try {
      const response = await paymentApi.checkPendingCryptoPayment(subId);

      if (!response.isError && response.result.pending) {
        set(pendingPaymentCurrency, response.result.currency);
      }
      else {
        set(pendingPaymentCurrency, undefined);
      }
    }
    catch (error) {
      logger.error('Failed to check pending crypto payment:', error);
      set(pendingPaymentCurrency, undefined);
    }
    finally {
      fetchInProgress = false;
    }
  }

  /**
   * Check if a crypto payment is pending for this subscription
   */
  function isCryptoPaymentPending(subscription: UserSubscription): boolean {
    const tx = get(pendingTx);
    if (!tx)
      return false;

    const isPendingWithoutUpgrade = isSubPending(subscription) && !tx.isUpgrade;
    const isUpgradeWithUpgrade = isSubRequestingUpgrade(subscription) && tx.isUpgrade;
    return (isPendingWithoutUpgrade || isUpgradeWithUpgrade) && subscription.id === tx.subscriptionId;
  }

  /**
   * Check if we should show payment detail link for this subscription
   */
  function shouldShowPaymentDetail(subscription: UserSubscription): boolean {
    if (subscription.paymentProvider !== PaymentProvider.CRYPTO) {
      return false;
    }
    const isPending = isSubPending(subscription);
    const isUpgrade = isSubRequestingUpgrade(subscription);
    const transactionNotInitiated = !isCryptoPaymentPending(subscription);
    return (isPending || isUpgrade) && transactionNotInitiated;
  }

  /**
   * Get the block explorer link for a pending transaction
   */
  function getBlockExplorerLink(pending: PendingTx): RouteLocationRaw {
    return {
      path: `${pending.blockExplorerUrl}/${pending.hash}`,
    };
  }

  // Watch for subscription changes and fetch on the client only
  if (import.meta.client) {
    watch(firstRenewableSubId, async (subId) => {
      if (subId && pendingFetchSubId !== subId) {
        await fetchPendingCurrency(subId);
      }
    }, { immediate: true });
  }

  return {
    getBlockExplorerLink,
    isCryptoPaymentPending,
    pendingPaymentCurrency,
    pendingTx,
    renewLink,
    shouldShowPaymentDetail,
  };
}
