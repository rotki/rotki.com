<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import CancelSubscription from '~/components/account/home/CancelSubscription.vue';
import CancelUpgradeDialog from '~/components/account/home/CancelUpgradeDialog.vue';
import ResumeSubscriptionDialog from '~/components/account/home/ResumeSubscriptionDialog.vue';
import {
  SubscriptionAction,
  type SubscriptionActionType,
} from '~/components/account/home/subscription-table/types';
import UpgradePlanDialog from '~/components/account/home/UpgradePlanDialog.vue';

interface Props {
  activeAction?: SubscriptionActionType;
  inProgress: boolean;
  operationType?: SubscriptionActionType;
}

const activeSubscription = defineModel<UserSubscription>();

defineProps<Props>();

const emit = defineEmits<{
  'cancel-subscription': [subscription: UserSubscription];
  'resume-subscription': [subscription: UserSubscription];
  'cancel-upgrade': [subscriptionId: string];
}>();

function handleCancelSubscription(subscription: UserSubscription): void {
  emit('cancel-subscription', subscription);
}

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
      @confirm="handleCancelSubscription($event)"
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
