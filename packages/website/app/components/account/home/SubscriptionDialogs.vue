<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import CancelSubscription, { type CancelSubscriptionConfirmEvent } from '~/components/account/home/CancelSubscription.vue';
import CancelUpgradeDialog from '~/components/account/home/CancelUpgradeDialog.vue';
import ResumeSubscriptionDialog from '~/components/account/home/ResumeSubscriptionDialog.vue';
import {
  SubscriptionAction,
  type SubscriptionActionType,
} from '~/components/account/home/subscription-table/types';
import UpgradePlanDialog from '~/components/account/home/UpgradePlanDialog.vue';

const activeSubscription = defineModel<UserSubscription>();

const { activeAction, inProgress, operationType } = defineProps<{
  activeAction?: SubscriptionActionType;
  inProgress: boolean;
  operationType?: SubscriptionActionType;
}>();

const emit = defineEmits<{
  'cancel-subscription': [payload: CancelSubscriptionConfirmEvent];
  'resume-subscription': [subscription: UserSubscription];
  'cancel-upgrade': [subscriptionId: string];
}>();

function handleResumeSubscription(subscription: UserSubscription): void {
  emit('resume-subscription', subscription);
}

function handleCancelUpgrade(subscriptionId: string): void {
  emit('cancel-upgrade', subscriptionId);
}
</script>

<template>
  <div>
    <CancelSubscription
      v-if="activeAction === SubscriptionAction.CANCEL && activeSubscription"
      v-model="activeSubscription"
      :loading="operationType === SubscriptionAction.CANCEL && inProgress"
      @confirm="emit('cancel-subscription', $event)"
    />

    <ResumeSubscriptionDialog
      v-if="activeAction === SubscriptionAction.RESUME && activeSubscription"
      v-model="activeSubscription"
      :loading="operationType === SubscriptionAction.RESUME && inProgress"
      @confirm="handleResumeSubscription($event)"
    />

    <UpgradePlanDialog
      v-if="activeAction === SubscriptionAction.UPGRADE && activeSubscription"
      v-model="activeSubscription"
    />

    <CancelUpgradeDialog
      v-if="activeAction === SubscriptionAction.CANCEL_UPGRADE && activeSubscription"
      v-model="activeSubscription"
      :loading="operationType === SubscriptionAction.CANCEL_UPGRADE && inProgress"
      @confirm="handleCancelUpgrade($event)"
    />
  </div>
</template>
