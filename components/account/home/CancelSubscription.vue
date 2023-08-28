<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { type Subscription } from '~/types';
import { useMainStore } from '~/store';

const props = defineProps<{
  subscription: Subscription;
}>();

const { subscription } = toRefs(props);
const isPending = computed(() => get(subscription).status === 'Pending');
const confirm = ref(false);
const store = useMainStore();
const { cancellationError } = storeToRefs(store);

const cancelSubscription = async () => {
  set(confirm, false);
  await store.cancelSubscription(get(subscription));
};

const { t } = useI18n();
</script>

<template>
  <div>
    <RuiButton
      variant="text"
      type="button"
      color="warning"
      @click="confirm = true"
    >
      {{ t('actions.cancel') }}
    </RuiButton>

    <RuiDialog v-model="confirm">
      <template #title>
        {{ t('account.subscriptions.cancellation.title') }}
      </template>

      <div class="whitespace-break-spaces mb-4">
        <i18n-t
          keypath="account.subscriptions.cancellation.description"
          scope="global"
        >
          <template #benefits>
            <ul class="list-disc ml-5">
              <li>{{ t('account.subscriptions.cancellation.benefits.1') }}</li>
              <li>
                <i18n-t
                  keypath="account.subscriptions.cancellation.benefits.2"
                  scope="global"
                >
                  <template #bug_tracker>
                    <ButtonLink
                      inline
                      color="primary"
                      external
                      class="underline"
                      to="https://github.com/rotki/rotki/issues"
                    >
                      {{ t('account.subscriptions.cancellation.bug_tracker') }}
                    </ButtonLink>
                  </template>
                </i18n-t>
              </li>
              <li>{{ t('account.subscriptions.cancellation.benefits.3') }}</li>
              <li>{{ t('account.subscriptions.cancellation.benefits.4') }}</li>
            </ul>
          </template>

          <template #subscription_status>
            <span v-if="!isPending">
              {{
                t(
                  'account.subscriptions.cancellation.subscription_status.normal',
                  {
                    start_date: subscription.createdDate,
                    end_date: subscription.nextActionDate,
                  },
                )
              }}
            </span>
            <span v-else>
              {{
                t(
                  'account.subscriptions.cancellation.subscription_status.pending',
                  {
                    start_date: subscription.createdDate,
                  },
                )
              }}
            </span>
          </template>
        </i18n-t>
      </div>

      <template #actions>
        <RuiButton variant="text" color="primary" @click="confirm = false">
          {{ t('account.subscriptions.cancellation.actions.no') }}
        </RuiButton>

        <RuiButton color="error" @click="cancelSubscription()">
          {{ t('account.subscriptions.cancellation.actions.yes') }}
        </RuiButton>
      </template>
    </RuiDialog>

    <FloatingNotification
      closeable
      :visible="!!cancellationError"
      :timeout="3000"
      @close="cancellationError = ''"
    >
      <template #title>
        {{ t('account.subscriptions.cancellation.notification.title') }}
      </template>
      {{ cancellationError }}
    </FloatingNotification>
  </div>
</template>
