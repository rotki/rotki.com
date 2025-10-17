<script setup lang="ts">
import type { AvailablePlans } from '@rotki/card-payment-common/schemas/plans';
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { RouteLocationRaw } from 'vue-router';
import { isSubRequestingUpgrade } from '@rotki/card-payment-common';
import BlockExplorerActionButton from '~/components/account/home/subscription-table/actions/BlockExplorerActionButton.vue';
import CancelActionButton from '~/components/account/home/subscription-table/actions/CancelActionButton.vue';
import CancelUpgradeActionButton from '~/components/account/home/subscription-table/actions/CancelUpgradeActionButton.vue';
import PaymentDetailActionButton from '~/components/account/home/subscription-table/actions/PaymentDetailActionButton.vue';
import RenewActionButton from '~/components/account/home/subscription-table/actions/RenewActionButton.vue';
import ResumeActionButton from '~/components/account/home/subscription-table/actions/ResumeActionButton.vue';
import UpgradeActionButton from '~/components/account/home/subscription-table/actions/UpgradeActionButton.vue';
import { pendingPaymentLink } from '~/components/account/home/subscription-table/config';
import {
  type CryptoPaymentState,
  type OperationState,
  SubscriptionAction,
  type SubscriptionActionEvent,
  type SubscriptionActionType,
} from './types';

interface Props {
  subscription: UserSubscription;
  actionsClasses: string;
  availablePlans: AvailablePlans;
  operationState: OperationState;
  cryptoPaymentState: CryptoPaymentState;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  action: [event: SubscriptionActionEvent];
}>();

const { t } = useI18n({ useScope: 'global' });

const { hasAction, displayActions } = useSubscriptionActions();

const { isCryptoPaymentPending, shouldShowPaymentDetail, getBlockExplorerLink } = useSubscriptionCryptoPayment({
  renewableSubscriptions: computed<UserSubscription[]>(() =>
    props.subscription.actions.includes('renew') ? [props.subscription] : [],
  ),
});

interface ActionConfig<T> {
  props: T;
  visible: boolean;
}

interface ActionState {
  upgrade: ActionConfig<{ actionsClasses: string }>;
  cancel: ActionConfig<{
    actionsClasses: string;
    cancellationStatus?: string;
    disabled: boolean;
    loading: boolean;
    subscriptionId: string;
  }>;
  renew: ActionConfig<{
    actionsClasses: string;
    disabled: boolean;
    to: RouteLocationRaw;
  }>;
  blockExplorer: ActionConfig<{
    actionsClasses: string;
    to: RouteLocationRaw;
  }>;
  paymentDetail: ActionConfig<{
    actionsClasses: string;
    disabled: boolean;
    to: RouteLocationRaw;
  }>;
  cancelUpgrade: ActionConfig<{
    actionsClasses: string;
    loading: boolean;
  }>;
  resume: ActionConfig<{
    actionsClasses: string;
    disabled: boolean;
    loading: boolean;
    nextActionDate: string;
    resumeStatus?: string;
    subscriptionId: string;
  }>;
  shouldDisplay: boolean;
}

const actionState = computed<ActionState>(() => {
  const { inProgress, operationType, status, activeAction, activeSubscription } = props.operationState;
  const { pendingTx, renewLink } = props.cryptoPaymentState;

  const isCancelLoading = operationType === SubscriptionAction.CANCEL && activeAction === SubscriptionAction.CANCEL && inProgress && activeSubscription?.id === props.subscription.id;
  const isResumeLoading = operationType === SubscriptionAction.RESUME && activeAction === SubscriptionAction.RESUME && inProgress && activeSubscription?.id === props.subscription.id;
  const isCancelUpgradeLoading = operationType === SubscriptionAction.CANCEL_UPGRADE && inProgress;
  const isPendingCrypto = isCryptoPaymentPending(props.subscription);
  const isRequestingUpgrade = isSubRequestingUpgrade(props.subscription);
  const blockExplorerLink = pendingTx ? getBlockExplorerLink(pendingTx) : { path: '' };

  const baseProps = { actionsClasses: props.actionsClasses };

  return {
    blockExplorer: {
      props: {
        ...baseProps,
        to: blockExplorerLink,
      },
      visible: isPendingCrypto,
    },
    cancel: {
      props: {
        ...baseProps,
        cancellationStatus: isCancelLoading && status ? status : undefined,
        disabled: inProgress,
        loading: isCancelLoading,
        subscriptionId: props.subscription.id,
      },
      visible: hasAction(props.subscription, SubscriptionAction.CANCEL),
    },
    cancelUpgrade: {
      props: {
        ...baseProps,
        loading: isCancelUpgradeLoading,
      },
      visible: isRequestingUpgrade && !isPendingCrypto,
    },
    paymentDetail: {
      props: {
        ...baseProps,
        disabled: inProgress,
        to: pendingPaymentLink,
      },
      visible: shouldShowPaymentDetail(props.subscription),
    },
    renew: {
      props: {
        ...baseProps,
        disabled: inProgress,
        to: renewLink,
      },
      visible: hasAction(props.subscription, SubscriptionAction.RENEW),
    },
    resume: {
      props: {
        ...baseProps,
        disabled: inProgress,
        loading: isResumeLoading,
        nextActionDate: props.subscription.nextActionDate,
        resumeStatus: isResumeLoading && status ? status : undefined,
        subscriptionId: props.subscription.id,
      },
      visible: props.subscription.isSoftCanceled,
    },
    shouldDisplay: displayActions(props.subscription, props.availablePlans),
    upgrade: {
      props: baseProps,
      visible: hasAction(props.subscription, SubscriptionAction.UPGRADE, props.availablePlans) && !isCancelLoading,
    },
  };
});

function handleAction(action: SubscriptionActionType): void {
  emit('action', { action, subscription: props.subscription });
}
</script>

<template>
  <div
    v-if="actionState.shouldDisplay"
    class="flex flex-col items-start gap-1"
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
