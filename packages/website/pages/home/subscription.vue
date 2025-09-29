<script lang="ts" setup>
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
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
const { userSubscriptions } = useUserSubscriptions();
const { requestRefresh } = useAccountRefresh();

const subscriptionOpsStore = useSubscriptionOperationsStore();
const { cancellationError, resumeError } = storeToRefs(subscriptionOpsStore);
const { setCancellationError, setResumeError } = subscriptionOpsStore;

const premium = computed<boolean>(() => get(account)?.canUsePremium ?? false);
const emailConfirmed = computed<boolean>(() => get(account)?.emailConfirmed ?? false);
const pending = computed<UserSubscription[]>(() => get(userSubscriptions).filter(sub => sub.pending));

const canUsePremium = computed<boolean>(() => {
  const arePending = get(pending);
  return get(account)?.canUsePremium || arePending.length > 0;
});

const subscriptionError = computed<string>(() => get(resumeError) || get(cancellationError));
const subscriptionErrorTitle = computed<string>(() => {
  if (get(resumeError)) {
    return t('account.subscriptions.resume.notification.title');
  }
  if (get(cancellationError)) {
    return t('account.subscriptions.cancellation.notification.title');
  }
  return '';
});

function dismissSubscriptionError(): void {
  if (get(resumeError)) {
    setResumeError('');
  }
  else if (get(cancellationError)) {
    setCancellationError('');
  }
}

onBeforeMount(() => {
  requestRefresh();
});
</script>

<template>
  <div class="space-y-10">
    <UnverifiedEmailWarning v-if="!emailConfirmed" />
    <PremiumPlaceholder v-else-if="!canUsePremium" />
    <ApiKeys v-if="premium" />
    <SubscriptionTable v-if="emailConfirmed" />
    <PaymentsTable />

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
