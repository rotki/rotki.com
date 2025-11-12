<script setup lang="ts">
import type { AvailablePlans } from '@rotki/card-payment-common/schemas/plans';
import type { RouteLocationRaw } from 'vue-router';
import { isSubRequestingUpgrade } from '@rotki/card-payment-common';
import { PaymentProvider, type Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { get, set } from '@vueuse/shared';
import BlockExplorerActionButton from '~/components/account/home/subscription-table/actions/BlockExplorerActionButton.vue';
import CancelActionButton from '~/components/account/home/subscription-table/actions/CancelActionButton.vue';
import CancelUpgradeActionButton from '~/components/account/home/subscription-table/actions/CancelUpgradeActionButton.vue';
import PaymentDetailActionButton from '~/components/account/home/subscription-table/actions/PaymentDetailActionButton.vue';
import RenewActionButton from '~/components/account/home/subscription-table/actions/RenewActionButton.vue';
import ResumeActionButton from '~/components/account/home/subscription-table/actions/ResumeActionButton.vue';
import UpgradeActionButton from '~/components/account/home/subscription-table/actions/UpgradeActionButton.vue';
import { getPendingPaymentLink } from '~/components/account/home/subscription-table/config';
import {
  type CryptoPaymentState,
  type OperationState,
  SubscriptionAction,
  type SubscriptionActionEvent,
  type SubscriptionActionType,
} from './types';

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
  subscriptionId: string;
  disabled: boolean;
  loading: boolean;
  cancellationStatus?: string;
}

interface ResumeActionProps extends BaseActionProps {
  subscriptionId: string;
  disabled: boolean;
  loading: boolean;
  nextActionDate: string;
  resumeStatus?: string;
}

interface CancelUpgradeActionProps extends BaseActionProps {
  loading: boolean;
}

interface ActionState {
  upgrade: ActionConfig<BaseActionProps>;
  cancel: ActionConfig<CancelActionProps>;
  renew: ActionConfig<DisableableNavigationActionProps>;
  blockExplorer: ActionConfig<NavigationActionProps>;
  paymentDetail: ActionConfig<DisableableNavigationActionProps>;
  cancelUpgrade: ActionConfig<CancelUpgradeActionProps>;
  resume: ActionConfig<ResumeActionProps>;
  shouldDisplay: boolean;
}

interface ActionContext {
  subscription: UserSubscription;
  baseProps: BaseActionProps;
  operationState: OperationState;
  cryptoPaymentState: CryptoPaymentState;
}

interface Props {
  subscription: UserSubscription;
  actionsClasses: string;
  availablePlans: AvailablePlans;
  operationState: OperationState;
  cryptoPaymentState: CryptoPaymentState;
  layout?: 'vertical' | 'horizontal';
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'vertical',
});

const emit = defineEmits<{
  action: [event: SubscriptionActionEvent];
}>();

const { t } = useI18n({ useScope: 'global' });

const upgradePlanId = ref<number>();

const { hasAction, displayActions } = useSubscriptionActions();
const { checkCryptoUpgradePayment } = useCryptoPaymentApi();

const { isCryptoPaymentPending, shouldShowPaymentDetail, getBlockExplorerLink, pendingPaymentCurrency } = useSubscriptionCryptoPayment({
  renewableSubscriptions: computed<UserSubscription[]>(() =>
    isCryptoPendingOrRenewal(props.subscription) ? [props.subscription] : [],
  ),
});

function isActionLoading(context: ActionContext, action: SubscriptionActionType): boolean {
  const { inProgress, operationType, activeAction, activeSubscription } = context.operationState;
  const subId = context.subscription.id;
  return operationType === action && activeAction === action && inProgress && activeSubscription?.id === subId;
}

function buildUpgradeAction(context: ActionContext): ActionConfig<BaseActionProps> {
  const isCancelLoading = isActionLoading(context, SubscriptionAction.CANCEL);

  return {
    props: context.baseProps,
    visible: hasAction(context.subscription, SubscriptionAction.UPGRADE, props.availablePlans) && !isCancelLoading,
  };
}

function buildCancelAction(context: ActionContext): ActionConfig<CancelActionProps> {
  const { inProgress, status } = context.operationState;
  const isCancelLoading = isActionLoading(context, SubscriptionAction.CANCEL);
  const subId = context.subscription.id;

  return {
    props: {
      ...context.baseProps,
      cancellationStatus: isCancelLoading && status ? status : undefined,
      disabled: inProgress,
      loading: isCancelLoading,
      subscriptionId: subId,
    },
    visible: hasAction(context.subscription, SubscriptionAction.CANCEL),
  };
}

function buildRenewAction(context: ActionContext): ActionConfig<DisableableNavigationActionProps> {
  const { inProgress } = context.operationState;
  const { renewLink } = context.cryptoPaymentState;

  return {
    props: {
      ...context.baseProps,
      disabled: inProgress,
      to: renewLink,
    },
    visible: hasAction(context.subscription, SubscriptionAction.RENEW),
  };
}

function buildBlockExplorerAction(context: ActionContext): ActionConfig<NavigationActionProps> {
  const { pendingTx } = context.cryptoPaymentState;
  const isPendingCrypto = isCryptoPaymentPending(context.subscription);
  const blockExplorerLink = pendingTx ? getBlockExplorerLink(pendingTx) : { path: '' };

  return {
    props: {
      ...context.baseProps,
      to: blockExplorerLink,
    },
    visible: isPendingCrypto,
  };
}

function buildPaymentDetailAction(context: ActionContext): ActionConfig<DisableableNavigationActionProps> {
  const { inProgress } = context.operationState;
  const subId = context.subscription.id;
  const planId = get(upgradePlanId) ?? context.subscription.planId;
  const isRequestingUpgrade = isSubRequestingUpgrade(context.subscription);
  const upgradeSubId = isRequestingUpgrade ? subId : undefined;

  const pendingPaymentLink = getPendingPaymentLink(planId, get(pendingPaymentCurrency), upgradeSubId);

  return {
    props: {
      ...context.baseProps,
      disabled: inProgress,
      to: pendingPaymentLink,
    },
    visible: shouldShowPaymentDetail(context.subscription),
  };
}

function buildCancelUpgradeAction(context: ActionContext): ActionConfig<CancelUpgradeActionProps> {
  const { inProgress, operationType } = context.operationState;
  const isCancelUpgradeLoading = operationType === SubscriptionAction.CANCEL_UPGRADE && inProgress;
  const isRequestingUpgrade = isSubRequestingUpgrade(context.subscription);
  const isPendingCrypto = isCryptoPaymentPending(context.subscription);

  return {
    props: {
      ...context.baseProps,
      loading: isCancelUpgradeLoading,
    },
    visible: isRequestingUpgrade && !isPendingCrypto,
  };
}

function buildResumeAction(context: ActionContext): ActionConfig<ResumeActionProps> {
  const { inProgress, status } = context.operationState;
  const isResumeLoading = isActionLoading(context, SubscriptionAction.RESUME);
  const subId = context.subscription.id;

  return {
    props: {
      ...context.baseProps,
      disabled: inProgress,
      loading: isResumeLoading,
      nextActionDate: context.subscription.nextActionDate,
      resumeStatus: isResumeLoading && status ? status : undefined,
      subscriptionId: subId,
    },
    visible: context.subscription.isSoftCanceled,
  };
}

const actionState = computed<ActionState>(() => {
  const context: ActionContext = {
    baseProps: { actionsClasses: props.actionsClasses },
    cryptoPaymentState: props.cryptoPaymentState,
    operationState: props.operationState,
    subscription: props.subscription,
  };

  return {
    blockExplorer: buildBlockExplorerAction(context),
    cancel: buildCancelAction(context),
    cancelUpgrade: buildCancelUpgradeAction(context),
    paymentDetail: buildPaymentDetailAction(context),
    renew: buildRenewAction(context),
    resume: buildResumeAction(context),
    shouldDisplay: displayActions(props.subscription, props.availablePlans),
    upgrade: buildUpgradeAction(context),
  };
});

const layoutClasses = computed<string>(() => {
  if (props.layout === 'horizontal') {
    return 'flex flex-wrap items-center gap-2';
  }
  return 'flex flex-col items-start gap-1';
});

function isCryptoPendingOrRenewal(subscription: UserSubscription): boolean {
  const isRenew = subscription.actions.includes('renew');
  const isPendingCrypto = subscription.paymentProvider === PaymentProvider.CRYPTO && subscription.pending;
  return isRenew || isPendingCrypto;
}

function handleAction(action: SubscriptionActionType): void {
  emit('action', { action, subscription: props.subscription });
}

watchImmediate(() => props.subscription, async (subscription) => {
  if (!isSubRequestingUpgrade(subscription)) {
    set(upgradePlanId, undefined);
    return;
  }

  const upgradePaymentResponse = await checkCryptoUpgradePayment(subscription.id);
  if (!upgradePaymentResponse.isError) {
    const { toPlan: { id } } = upgradePaymentResponse.result;
    set(upgradePlanId, id);
  }
  else {
    set(upgradePlanId, undefined);
  }
});
</script>

<template>
  <div
    v-if="actionState.shouldDisplay"
    :class="layoutClasses"
  >
    <UpgradeActionButton
      v-if="actionState.upgrade.visible"
      v-bind="actionState.upgrade.props"
      @click="handleAction(SubscriptionAction.UPGRADE)"
    />

    <CancelActionButton
      v-if="actionState.cancel.visible"
      v-bind="actionState.cancel.props"
      @click="handleAction(SubscriptionAction.CANCEL)"
    />

    <RenewActionButton
      v-if="actionState.renew.visible"
      v-bind="actionState.renew.props"
    />

    <BlockExplorerActionButton
      v-if="actionState.blockExplorer.visible"
      v-bind="actionState.blockExplorer.props"
    />

    <PaymentDetailActionButton
      v-else-if="actionState.paymentDetail.visible"
      v-bind="actionState.paymentDetail.props"
    />

    <CancelUpgradeActionButton
      v-if="actionState.cancelUpgrade.visible"
      v-bind="actionState.cancelUpgrade.props"
      @click="handleAction(SubscriptionAction.CANCEL_UPGRADE)"
    />

    <ResumeActionButton
      v-if="actionState.resume.visible"
      v-bind="actionState.resume.props"
      @click="handleAction(SubscriptionAction.RESUME)"
    />
  </div>
  <div
    v-else
    class="capitalize m-2"
  >
    {{ t('common.none') }}
  </div>
</template>
