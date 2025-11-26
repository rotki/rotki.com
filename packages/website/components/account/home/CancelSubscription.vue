<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { get } from '@vueuse/shared';
import { formatDate } from '~/utils/date';

const modelValue = defineModel<UserSubscription | undefined>({ required: true });

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  confirm: [val: UserSubscription];
}>();

const isPending = computed<boolean>(() => get(modelValue)?.status === 'Pending');
// Remove store usage since notifications are handled at layout level

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
    @closed="modelValue = undefined"
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
            <i18n-t
              v-if="!isPending"
              keypath="account.subscriptions.cancellation.subscription_status.normal"
            >
              <template #start_date>
                <strong>
                  {{ formatDate(modelValue?.createdDate) }}
                </strong>
              </template>
              <template #end_date>
                <strong>
                  {{ formatDate(modelValue?.nextActionDate) }}
                </strong>
              </template>
            </i18n-t>
            <i18n-t
              v-else
              keypath="account.subscriptions.cancellation.subscription_status.pending"
            >
              <template #start_date>
                <strong>
                  {{ formatDate(modelValue?.createdDate) }}
                </strong>
              </template>
            </i18n-t>
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
</template>
