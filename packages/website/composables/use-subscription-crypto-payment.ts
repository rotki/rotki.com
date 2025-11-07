import type { Ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { PendingTx } from '~/types';
import { isSubPending, isSubRequestingUpgrade } from '@rotki/card-payment-common';
import {
  PaymentProvider,
  type Subscription as UserSubscription,
} from '@rotki/card-payment-common/schemas/subscription';
import { get, isDefined } from '@vueuse/shared';
import { usePendingTx } from '~/composables/crypto-payment';
import { PaymentMethod } from '~/types/payment';

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

export function useSubscriptionCryptoPayment({
  renewableSubscriptions,
}: UseSubscriptionCryptoPaymentOptions): UseSubscriptionCryptoPaymentReturn {
  const pendingTx = usePendingTx();
  const paymentApi = useCryptoPaymentApi();

  /**
   * Get the currency for any pending crypto payment
   */
  const pendingPaymentCurrency = computedAsync<string | undefined>(async () => {
    const subs = get(renewableSubscriptions);
    if (subs.length === 0)
      return undefined;

    const response = await paymentApi.checkPendingCryptoPayment(subs[0].id);

    if (response.isError || !response.result.pending)
      return undefined;

    return response.result.currency;
  });

  /**
   * Get the link to renew a subscription with crypto payment
   */
  const renewLink = computed<{ path: string; query: Record<string, string> }>(() => {
    const link: { path: string; query: Record<string, string> } = {
      path: '/checkout/pay/request-crypto',
      query: {},
    };

    const subs = get(renewableSubscriptions);

    if (subs.length > 0) {
      const sub = subs[0];
      link.query = {
        id: sub.id,
        method: PaymentMethod.BLOCKCHAIN.toString(),
        plan: sub.durationInMonths.toString(),
      };
    }

    if (isDefined(pendingPaymentCurrency)) {
      link.query = {
        ...link.query,
        currency: get(pendingPaymentCurrency),
        method: PaymentMethod.BLOCKCHAIN.toString(),
      };
    }

    return link;
  });

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

  return {
    getBlockExplorerLink,
    isCryptoPaymentPending,
    pendingPaymentCurrency,
    pendingTx,
    renewLink,
    shouldShowPaymentDetail,
  };
}
