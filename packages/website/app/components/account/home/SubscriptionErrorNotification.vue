<script setup lang="ts">
import { get } from '@vueuse/shared';
import { storeToRefs } from 'pinia';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';
import { SubscriptionAction } from '~/components/account/home/subscription-table/types';
import { useSubscriptionOperationsStore } from '~/store/subscription-operations';

const { t } = useI18n({ useScope: 'global' });

const subscriptionOpsStore = useSubscriptionOperationsStore();
const { error, operationType } = storeToRefs(subscriptionOpsStore);
const { setError } = subscriptionOpsStore;

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
</script>

<template>
  <FloatingNotification
    :timeout="3000"
    :visible="!!subscriptionError"
    closeable
    @dismiss="setError('')"
  >
    <template #title>
      {{ subscriptionErrorTitle }}
    </template>
    {{ subscriptionError }}
  </FloatingNotification>
</template>
