<script setup lang="ts">
import type { AvailablePlans } from '@rotki/card-payment-common/schemas/plans';
import { PaymentProvider, type Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { isSubRequestingUpgrade } from '@rotki/card-payment-common/utils/subscription';
import { get, set } from '@vueuse/shared';
import { type ActionState, buildActionState } from '~/components/account/home/subscription-table/action-state';
import BlockExplorerActionButton from '~/components/account/home/subscription-table/actions/BlockExplorerActionButton.vue';
import CancelActionButton from '~/components/account/home/subscription-table/actions/CancelActionButton.vue';
import CancelUpgradeActionButton from '~/components/account/home/subscription-table/actions/CancelUpgradeActionButton.vue';
import PaymentDetailActionButton from '~/components/account/home/subscription-table/actions/PaymentDetailActionButton.vue';
import RenewActionButton from '~/components/account/home/subscription-table/actions/RenewActionButton.vue';
import ResumeActionButton from '~/components/account/home/subscription-table/actions/ResumeActionButton.vue';
import UpgradeActionButton from '~/components/account/home/subscription-table/actions/UpgradeActionButton.vue';
import { ActionButtonStyleKey } from '~/components/account/home/subscription-table/types';
import { useSubscriptionActions } from '~/composables/subscription/use-subscription-actions';
import { useSubscriptionCryptoPayment } from '~/composables/subscription/use-subscription-crypto-payment';
import { useCryptoPaymentApi } from '~/modules/checkout/composables/use-crypto-payment-api';
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
  /** `row` lines the actions up at the end, wrapping when the table is narrow, for a table cell. */
  layout?: 'vertical' | 'horizontal' | 'row';
  /** Full outlined buttons instead of compact text links, for the plan card. */
  prominent?: boolean;
}

const {
  subscription,
  actionsClasses,
  availablePlans,
  operationState,
  cryptoPaymentState,
  layout = 'vertical',
  prominent = false,
} = defineProps<Props>();

const emit = defineEmits<{
  action: [event: SubscriptionActionEvent];
}>();

provide(ActionButtonStyleKey, prominent ? { variant: 'outlined' } : { variant: 'text', size: 'sm' });

const upgradePlanId = ref<number>();

const { t } = useI18n({ useScope: 'global' });

const { hasAction, displayActions } = useSubscriptionActions();
const { checkCryptoUpgradePayment } = useCryptoPaymentApi();
const { isCryptoPaymentPending, shouldShowPaymentDetail, getBlockExplorerLink, pendingPaymentCurrency } = useSubscriptionCryptoPayment({
  renewableSubscriptions: computed<UserSubscription[]>(() =>
    isCryptoPendingOrRenewal(subscription) ? [subscription] : [],
  ),
});

const actionState = computed<ActionState>(() => buildActionState({
  actionsClasses,
  checks: {
    displayActions: sub => displayActions(sub, availablePlans),
    getBlockExplorerLink,
    hasAction: (sub, action) => hasAction(sub, action, availablePlans),
    isCryptoPaymentPending,
    shouldShowPaymentDetail,
  },
  cryptoPaymentState,
  operationState,
  pendingPaymentCurrency: get(pendingPaymentCurrency),
  subscription,
  upgradePlanId: get(upgradePlanId),
}));

const layoutClasses = computed<string>(() => {
  if (layout === 'horizontal') {
    return 'flex flex-wrap items-center gap-2';
  }
  if (layout === 'row') {
    return 'flex flex-wrap items-center justify-end gap-x-2 gap-y-1';
  }
  return 'flex flex-col items-start gap-1';
});

function isCryptoPendingOrRenewal(subscription: UserSubscription): boolean {
  const isRenew = subscription.actions.includes('renew');
  const isPendingCrypto = subscription.paymentProvider === PaymentProvider.CRYPTO && subscription.pending;
  return isRenew || isPendingCrypto;
}

function handleAction(action: SubscriptionActionType): void {
  emit('action', { action, subscription });
}

watchImmediate(() => subscription, async (sub) => {
  if (!isSubRequestingUpgrade(sub)) {
    set(upgradePlanId, undefined);
    return;
  }

  const upgradePaymentResponse = await checkCryptoUpgradePayment(sub.id);
  if (upgradePaymentResponse.ok) {
    const { toPlan: { id } } = upgradePaymentResponse.value;
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
  <span
    v-else
    class="sr-only"
  >
    {{ t('common.none') }}
  </span>
</template>
