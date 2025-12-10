<script lang="ts" setup>
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import ActiveSubscriptionCard from '~/components/account/home/ActiveSubscriptionCard.vue';
import ActiveSubscriptionCardSkeleton from '~/components/account/home/ActiveSubscriptionCardSkeleton.vue';
import ApiKeys from '~/components/account/home/ApiKeys.vue';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import PaymentsTable from '~/components/account/home/PaymentsTable.vue';
import PremiumPlaceholder from '~/components/account/home/PremiumPlaceholder.vue';
import ReferralCode from '~/components/account/home/ReferralCode.vue';
import { SubscriptionAction } from '~/components/account/home/subscription-table/types';
import SubscriptionTable from '~/components/account/home/SubscriptionTable.vue';
import UnverifiedEmailWarning from '~/components/account/home/UnverifiedEmailWarning.vue';
import { useUserSubscriptions } from '~/composables/subscription/use-user-subscriptions';
import { useAccountRefresh } from '~/composables/use-app-events';
import { useMainStore } from '~/store';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';

definePageMeta({
  layout: 'account',
  middleware: ['maintenance', 'authentication'],
});

const { t } = useI18n({ useScope: 'global' });

const store = useMainStore();
const { account } = storeToRefs(store);
const { userSubscriptions, activeOrPendingSubscription, refresh, initialLoading: initialSubscriptionsLoading } = useUserSubscriptions();
const { requestRefresh } = useAccountRefresh();

const subscriptionOpsStore = useSubscriptionOperationsStore();
const { error, operationType } = storeToRefs(subscriptionOpsStore);
const { setError } = subscriptionOpsStore;

const premium = computed<boolean>(() => get(account)?.canUsePremium ?? false);
const isSubscriber = computed<boolean>(() => get(account)?.hasActiveSubscription ?? false);
const emailConfirmed = computed<boolean>(() => get(account)?.emailConfirmed ?? false);
const pending = computed<UserSubscription[]>(() => get(userSubscriptions).filter(sub => sub.pending));
const canUsePremium = computed<boolean>(() => get(premium) || get(pending).length > 0);

const subscriptionError = computed<string>(() => get(error) || '');
const subscriptionErrorTitle = computed<string>(() => {
  const type = get(operationType);
  if (type === SubscriptionAction.RESUME) {
    return t('account.subscriptions.resume.notification.title');
  }
  if (type === SubscriptionAction.CANCEL) {
    return t('account.subscriptions.cancellation.notification.title');
  }
  return '';
});

function dismissSubscriptionError(): void {
  setError('');
}

onBeforeMount(() => {
  requestRefresh();
});
</script>

<template>
  <div class="space-y-10">
    <UnverifiedEmailWarning v-if="!emailConfirmed" />
    <PremiumPlaceholder v-else-if="!canUsePremium && !isSubscriber" />

    <template v-else>
      <ActiveSubscriptionCardSkeleton v-if="initialSubscriptionsLoading" />
      <ActiveSubscriptionCard
        v-else-if="activeOrPendingSubscription"
        :subscription="activeOrPendingSubscription"
        @refresh="refresh()"
      />
      <PremiumPlaceholder v-else />
    </template>

    <ApiKeys v-if="premium" />
    <ReferralCode v-if="emailConfirmed && premium" />
    <SubscriptionTable v-if="emailConfirmed" />
    <PaymentsTable :pending="pending" />

    <!-- Unified subscription error notification -->
    <FloatingNotification
      :timeout="3000"
      :visible="!!subscriptionError"
      closeable
      @dismiss="dismissSubscriptionError()"
    >
      <template #title>
        {{ subscriptionErrorTitle }}
      </template>
      {{ subscriptionError }}
    </FloatingNotification>
  </div>
</template>
