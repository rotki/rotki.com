import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { set } from '@vueuse/shared';
import { SubscriptionAction, type SubscriptionActionType } from '~/components/account/home/subscription-table/types';
import { useSubscription } from '~/composables/subscription/use-subscription';
import { useCryptoPaymentApi } from '~/modules/checkout/composables/use-crypto-payment-api';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';

interface UseSubscriptionOperationsOptions {
  onActionComplete: () => Promise<void>;
}

interface UseSubscriptionOperationsReturn {
  clearActiveState: (activeAction?: Ref<SubscriptionActionType | undefined>, activeSubscription?: Ref<UserSubscription | undefined>) => void;
  resumeSubscription: (subscription: UserSubscription, activeAction?: Ref<SubscriptionActionType | undefined>, activeSubscription?: Ref<UserSubscription | undefined>) => Promise<void>;
  cancelSubscription: (subscription: UserSubscription, activeAction?: Ref<SubscriptionActionType | undefined>, activeSubscription?: Ref<UserSubscription | undefined>) => Promise<void>;
  cancelUpgrade: (subscriptionId: string, activeAction?: Ref<SubscriptionActionType | undefined>, activeSubscription?: Ref<UserSubscription | undefined>) => Promise<void>;
}

/**
 * Composable for executing subscription operations (cancel, resume, upgrade)
 * Centralizes the common logic used by ActiveSubscriptionCard and SubscriptionTable
 */
export function useSubscriptionOperations(options?: UseSubscriptionOperationsOptions): UseSubscriptionOperationsReturn {
  const { cancelUserSubscription, resumeUserSubscription } = useSubscription();
  const paymentApi = useCryptoPaymentApi();

  const subscriptionOpsStore = useSubscriptionOperationsStore();
  const {
    clearOperation,
    setStatus,
    startOperation,
  } = subscriptionOpsStore;

  function clearActiveState(
    activeAction?: Ref<SubscriptionActionType | undefined>,
    activeSubscription?: Ref<UserSubscription | undefined>,
  ): void {
    clearOperation();
    if (activeAction) {
      set(activeAction, undefined);
    }
    if (activeSubscription) {
      set(activeSubscription, undefined);
    }
  }

  async function resumeSubscription(
    subscription: UserSubscription,
    activeAction?: Ref<SubscriptionActionType | undefined>,
    activeSubscription?: Ref<UserSubscription | undefined>,
  ): Promise<void> {
    startOperation(SubscriptionAction.RESUME);

    await resumeUserSubscription(subscription, (statusMessage: string) => {
      setStatus(statusMessage);
    });

    if (options?.onActionComplete) {
      await options.onActionComplete();
    }

    clearActiveState(activeAction, activeSubscription);
  }

  async function cancelSubscription(
    subscription: UserSubscription,
    activeAction?: Ref<SubscriptionActionType | undefined>,
    activeSubscription?: Ref<UserSubscription | undefined>,
  ): Promise<void> {
    startOperation(SubscriptionAction.CANCEL);

    await cancelUserSubscription(subscription, (statusMessage: string) => {
      setStatus(statusMessage);
    });

    if (options?.onActionComplete) {
      await options.onActionComplete();
    }

    clearActiveState(activeAction, activeSubscription);
  }

  async function cancelUpgrade(
    subscriptionId: string,
    activeAction?: Ref<SubscriptionActionType | undefined>,
    activeSubscription?: Ref<UserSubscription | undefined>,
  ): Promise<void> {
    startOperation(SubscriptionAction.CANCEL_UPGRADE);
    await paymentApi.cancelUpgradeRequest(subscriptionId);

    if (options?.onActionComplete) {
      await options.onActionComplete();
    }

    clearActiveState(activeAction, activeSubscription);
  }

  return {
    clearActiveState,
    resumeSubscription,
    cancelSubscription,
    cancelUpgrade,
  };
}
