import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { RouteLocationRaw } from 'vue-router';
import type { PendingTx } from '~/types';
import { isSubRequestingUpgrade } from '@rotki/card-payment-common/utils/subscription';
import { getPendingPaymentLink } from '~/components/account/home/subscription-table/config';
import {
  type CryptoPaymentState,
  type OperationState,
  SubscriptionAction,
  type SubscriptionActionType,
} from '~/components/account/home/subscription-table/types';

interface ActionConfig<T> {
  props: T;
  visible: boolean;
}

interface BaseActionProps {
  actionsClasses: string;
}

interface NavigationActionProps extends BaseActionProps {
  to: RouteLocationRaw;
}

interface DisableableNavigationActionProps extends NavigationActionProps {
  disabled: boolean;
}

interface CancelActionProps extends BaseActionProps {
  disabled: boolean;
  loading: boolean;
  cancellationStatus?: string;
}

interface ResumeActionProps extends BaseActionProps {
  disabled: boolean;
  loading: boolean;
  nextActionDate: string;
  resumeStatus?: string;
}

interface CancelUpgradeActionProps extends BaseActionProps {
  loading: boolean;
}

/** Which buttons a subscription shows, and the props each one gets. */
export interface ActionState {
  upgrade: ActionConfig<BaseActionProps>;
  cancel: ActionConfig<CancelActionProps>;
  renew: ActionConfig<DisableableNavigationActionProps>;
  blockExplorer: ActionConfig<NavigationActionProps>;
  paymentDetail: ActionConfig<DisableableNavigationActionProps>;
  cancelUpgrade: ActionConfig<CancelUpgradeActionProps>;
  resume: ActionConfig<ResumeActionProps>;
  shouldDisplay: boolean;
}

/** The rules that come from composables, passed in so the state below stays a plain function. */
export interface ActionChecks {
  hasAction: (subscription: UserSubscription, action: SubscriptionActionType) => boolean;
  displayActions: (subscription: UserSubscription) => boolean;
  isCryptoPaymentPending: (subscription: UserSubscription) => boolean;
  shouldShowPaymentDetail: (subscription: UserSubscription) => boolean;
  getBlockExplorerLink: (pendingTx: PendingTx) => RouteLocationRaw;
}

export interface ActionContext {
  subscription: UserSubscription;
  actionsClasses: string;
  operationState: OperationState;
  cryptoPaymentState: CryptoPaymentState;
  /** The plan an upgrade request is for, which the pending payment link pays. */
  upgradePlanId?: number;
  pendingPaymentCurrency?: string;
  checks: ActionChecks;
}

function isActionLoading({ operationState, subscription }: ActionContext, action: SubscriptionActionType): boolean {
  const { inProgress, operationType, activeAction, activeSubscription } = operationState;
  return operationType === action && activeAction === action && inProgress && activeSubscription?.id === subscription.id;
}

function buildUpgradeAction(context: ActionContext, baseProps: BaseActionProps): ActionConfig<BaseActionProps> {
  return {
    props: baseProps,
    visible: context.checks.hasAction(context.subscription, SubscriptionAction.UPGRADE) && !isActionLoading(context, SubscriptionAction.CANCEL),
  };
}

function buildCancelAction(context: ActionContext, baseProps: BaseActionProps): ActionConfig<CancelActionProps> {
  const { inProgress, status } = context.operationState;
  const loading = isActionLoading(context, SubscriptionAction.CANCEL);

  return {
    props: {
      ...baseProps,
      cancellationStatus: loading && status ? status : undefined,
      disabled: inProgress,
      loading,
    },
    visible: context.checks.hasAction(context.subscription, SubscriptionAction.CANCEL),
  };
}

function buildRenewAction(context: ActionContext, baseProps: BaseActionProps): ActionConfig<DisableableNavigationActionProps> {
  return {
    props: {
      ...baseProps,
      disabled: context.operationState.inProgress,
      to: context.cryptoPaymentState.renewLink,
    },
    visible: context.checks.hasAction(context.subscription, SubscriptionAction.RENEW),
  };
}

function buildBlockExplorerAction(context: ActionContext, baseProps: BaseActionProps): ActionConfig<NavigationActionProps> {
  const { pendingTx } = context.cryptoPaymentState;

  return {
    props: {
      ...baseProps,
      to: pendingTx ? context.checks.getBlockExplorerLink(pendingTx) : '',
    },
    visible: context.checks.isCryptoPaymentPending(context.subscription),
  };
}

function buildPaymentDetailAction(context: ActionContext, baseProps: BaseActionProps): ActionConfig<DisableableNavigationActionProps> {
  const { subscription } = context;
  const planId = context.upgradePlanId ?? subscription.planId;
  const upgradeSubId = isSubRequestingUpgrade(subscription) ? subscription.id : undefined;

  return {
    props: {
      ...baseProps,
      disabled: context.operationState.inProgress,
      to: getPendingPaymentLink(planId, context.pendingPaymentCurrency, upgradeSubId),
    },
    visible: context.checks.shouldShowPaymentDetail(subscription),
  };
}

function buildCancelUpgradeAction(context: ActionContext, baseProps: BaseActionProps): ActionConfig<CancelUpgradeActionProps> {
  const { inProgress, operationType } = context.operationState;

  return {
    props: {
      ...baseProps,
      loading: operationType === SubscriptionAction.CANCEL_UPGRADE && inProgress,
    },
    visible: isSubRequestingUpgrade(context.subscription) && !context.checks.isCryptoPaymentPending(context.subscription),
  };
}

function buildResumeAction(context: ActionContext, baseProps: BaseActionProps): ActionConfig<ResumeActionProps> {
  const { inProgress, status } = context.operationState;
  const loading = isActionLoading(context, SubscriptionAction.RESUME);

  return {
    props: {
      ...baseProps,
      disabled: inProgress,
      loading,
      nextActionDate: context.subscription.nextActionDate,
      resumeStatus: loading && status ? status : undefined,
    },
    visible: context.subscription.isSoftCanceled,
  };
}

/** Works out every action button of one subscription from its state and the running operation. */
export function buildActionState(context: ActionContext): ActionState {
  const baseProps: BaseActionProps = { actionsClasses: context.actionsClasses };

  return {
    blockExplorer: buildBlockExplorerAction(context, baseProps),
    cancel: buildCancelAction(context, baseProps),
    cancelUpgrade: buildCancelUpgradeAction(context, baseProps),
    paymentDetail: buildPaymentDetailAction(context, baseProps),
    renew: buildRenewAction(context, baseProps),
    resume: buildResumeAction(context, baseProps),
    shouldDisplay: context.checks.displayActions(context.subscription),
    upgrade: buildUpgradeAction(context, baseProps),
  };
}
