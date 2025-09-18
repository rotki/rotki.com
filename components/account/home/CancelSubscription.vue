<script setup lang="ts">
import type { Subscription } from '~/types';
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const modelValue = defineModel<Subscription | undefined>({ required: true });

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  confirm: [val: Subscription];
}>();

const isPending = computed(() => get(modelValue)?.status === 'Pending');
const { cancellationError } = storeToRefs(useMainStore());

function cancelSubscription() {
  if (!isDefined(modelValue))
    return;

  emit('confirm', get(modelValue));
}

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <RuiDialog
    :model-value="!!modelValue && !loading"
    max-width="900"
    @close="modelValue = undefined"
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
              <li>{{ t('account.subscriptions.cancellation.benefits.line_1') }}</li>
              <li>
                <i18n-t
                  keypath="account.subscriptions.cancellation.benefits.line_2"
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
              <li>{{ t('account.subscriptions.cancellation.benefits.line_3') }}</li>
            </ul>
          </template>

          <template #subscription_status>
            <span v-if="!isPending">
              {{
                t(
                  'account.subscriptions.cancellation.subscription_status.normal',
                  {
                    start_date: modelValue?.createdDate ?? '',
                    end_date: modelValue?.nextActionDate ?? '',
                  },
                )
              }}
            </span>
            <span v-else>
              {{
                t(
                  'account.subscriptions.cancellation.subscription_status.pending',
                  {
                    start_date: modelValue?.createdDate ?? '',
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
          @click="modelValue = undefined"
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
