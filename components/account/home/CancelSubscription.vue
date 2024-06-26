<script setup lang="ts">
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import type { Subscription } from '~/types';

const props = defineProps<{
  subscription?: Subscription;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:model-value', value: boolean): void;
  (event: 'clear:errors'): void;
  (event: 'cancel', val: Subscription): void;
}>();

const { subscription } = toRefs(props);
const isPending = computed(() => get(subscription)?.status === 'Pending');
const store = useMainStore();
const { cancellationError } = storeToRefs(store);

function cancelSubscription() {
  const sub = get(subscription);
  if (!sub) {
    emit('update:model-value', false);
    return;
  }

  emit('cancel', sub);
}

const { t } = useI18n();
</script>

<template>
  <RuiDialog
    :model-value="modelValue"
    max-width="900"
    @update:model-value="emit('update:model-value', $event)"
  >
    <RuiCard>
      <template #header>
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
                      class="underline"
                      color="primary"
                      external
                      inline
                      to="https://github.com/rotki/rotki/issues"
                    >
                      {{ t('account.subscriptions.cancellation.bug_tracker') }}
                    </ButtonLink>
                  </template>
                </i18n-t>
              </li>
              <li>{{ t('account.subscriptions.cancellation.benefits.3') }}</li>
            </ul>
          </template>

          <template #subscription_status>
            <span v-if="!isPending">
              {{
                t(
                  'account.subscriptions.cancellation.subscription_status.normal',
                  {
                    start_date: subscription?.createdDate ?? '',
                    end_date: subscription?.nextActionDate ?? '',
                  },
                )
              }}
            </span>
            <span v-else>
              {{
                t(
                  'account.subscriptions.cancellation.subscription_status.pending',
                  {
                    start_date: subscription?.createdDate ?? '',
                  },
                )
              }}
            </span>
          </template>
        </i18n-t>
      </div>

      <div class="flex justify-end gap-4 pt-4">
        <RuiButton
          color="primary"
          variant="text"
          @click="emit('update:model-value', false)"
        >
          {{ t('account.subscriptions.cancellation.actions.no') }}
        </RuiButton>

        <RuiButton
          color="error"
          @click="cancelSubscription()"
        >
          {{ t('account.subscriptions.cancellation.actions.yes') }}
        </RuiButton>
      </div>
    </RuiCard>
  </RuiDialog>

  <FloatingNotification
    :timeout="3000"
    :visible="!!cancellationError"
    closeable
    @dismiss="cancellationError = ''"
  >
    <template #title>
      {{ t('account.subscriptions.cancellation.notification.title') }}
    </template>
    {{ cancellationError }}
  </FloatingNotification>
</template>
