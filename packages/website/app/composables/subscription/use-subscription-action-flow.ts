import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { Ref } from 'vue';
import type {
  CancelSubscriptionConfirmEvent,
  CryptoPaymentState,
  OperationState,
  SubscriptionActionEvent,
  SubscriptionActionType,
} from '~/components/account/home/subscription-table/types';
import { get, set } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import { useSubscriptionCryptoPayment } from '~/composables/subscription/use-subscription-crypto-payment';
import { useSubscriptionOperations } from '~/composables/subscription/use-subscription-operations';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';

interface UseSubscriptionActionFlowOptions {
  /** The subscriptions a renew or pending crypto payment can apply to. */
  renewableSubscriptions: Ref<UserSubscription[]>;
  /** Runs after a cancel, resume or cancelled upgrade, to reload what changed. */
  onActionComplete: () => Promise<void>;
}

interface UseSubscriptionActionFlowReturn {
  /** The action whose dialog is open, with `modelActiveSubscription` as its subject. */
  activeAction: Readonly<Ref<SubscriptionActionType | undefined>>;
  /** The dialogs' v-model: clearing it closes them. */
  modelActiveSubscription: Ref<UserSubscription | undefined>;
  inProgress: Readonly<Ref<boolean>>;
  operationType: Readonly<Ref<SubscriptionActionType | undefined>>;
  /** What `SubscriptionActionsCell` needs to show loading and status. */
  operationState: Readonly<Ref<OperationState>>;
  cryptoPaymentState: Readonly<Ref<CryptoPaymentState>>;
  /** Opens the dialog for the action a cell asked for. */
  handleAction: (event: SubscriptionActionEvent) => void;
  resumeSubscription: (subscription: UserSubscription) => Promise<void>;
  cancelSubscription: (event: CancelSubscriptionConfirmEvent) => Promise<void>;
  cancelUpgrade: (subscriptionId: string) => Promise<void>;
}

/**
 * The action buttons and their dialogs, shared by the plan card and the subscriptions table: which
 * action is open, the state the buttons show, and the operations the dialogs confirm.
 */
export function useSubscriptionActionFlow({ renewableSubscriptions, onActionComplete }: UseSubscriptionActionFlowOptions): UseSubscriptionActionFlowReturn {
  const activeAction = ref<SubscriptionActionType>();
  const modelActiveSubscription = ref<UserSubscription>();

  const { inProgress, operationType, status } = storeToRefs(useSubscriptionOperationsStore());
  const operations = useSubscriptionOperations({ onActionComplete });
  const { pendingTx, renewLink } = useSubscriptionCryptoPayment({ renewableSubscriptions });

  const operationState = computed<OperationState>(() => ({
    activeAction: get(activeAction),
    activeSubscription: get(modelActiveSubscription),
    inProgress: get(inProgress),
    operationType: get(operationType),
    status: get(status),
  }));

  const cryptoPaymentState = computed<CryptoPaymentState>(() => ({
    pendingTx: get(pendingTx),
    renewLink: get(renewLink),
  }));

  function handleAction({ action, subscription }: SubscriptionActionEvent): void {
    set(activeAction, action);
    set(modelActiveSubscription, subscription);
  }

  async function resumeSubscription(subscription: UserSubscription): Promise<void> {
    await operations.resumeSubscription(subscription, activeAction, modelActiveSubscription);
  }

  async function cancelSubscription({ subscription, feedback }: CancelSubscriptionConfirmEvent): Promise<void> {
    await operations.cancelSubscription(subscription, activeAction, modelActiveSubscription, feedback);
  }

  async function cancelUpgrade(subscriptionId: string): Promise<void> {
    await operations.cancelUpgrade(subscriptionId, activeAction, modelActiveSubscription);
  }

  return {
    activeAction: shallowReadonly(activeAction),
    cancelSubscription,
    cancelUpgrade,
    cryptoPaymentState,
    handleAction,
    inProgress,
    modelActiveSubscription,
    operationState,
    operationType,
    resumeSubscription,
  };
}
