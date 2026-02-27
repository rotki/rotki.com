<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { get, isDefined, set } from '@vueuse/shared';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { type CancellationFeedbackPayload, useCancellationFeedback } from '~/composables/subscription/use-cancellation-feedback';
import { formatDate } from '~/utils/date';

export interface CancelSubscriptionConfirmEvent {
  subscription: UserSubscription;
  feedback: CancellationFeedbackPayload;
}

const modelValue = defineModel<UserSubscription | undefined>({ required: true });

const { loading } = defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  confirm: [payload: CancelSubscriptionConfirmEvent];
}>();

const { t } = useI18n({ useScope: 'global' });

const {
  reasons,
  loading: reasonsLoading,
  selectedReason,
  comment,
  isOtherReason,
  isOtherSelected,
  isValid,
  fetchReasons,
  reset,
} = useCancellationFeedback();

const isPending = computed<boolean>(() => get(modelValue)?.status === 'Pending');

watch(modelValue, (val) => {
  if (val) {
    fetchReasons();
  }
  else {
    reset();
  }
}, { immediate: true });

function selectReason(value: number): void {
  set(selectedReason, value);
}

function cancelSubscription(): void {
  if (!isDefined(modelValue))
    return;

  emit('confirm', {
    subscription: get(modelValue),
    feedback: {
      reason: get(selectedReason)!,
      feedback: get(comment),
    },
  });
}
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
              scope="global"
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
              scope="global"
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

      <div class="rounded-lg border border-rui-grey-300 p-4 space-y-3">
        <div class="flex items-start gap-2.5">
          <RuiIcon
            name="lu-message-circle"
            size="20"
            class="text-rui-primary shrink-0 mt-0.5"
          />
          <div>
            <h6 class="text-sm font-bold leading-snug">
              {{ t('account.subscriptions.cancellation.feedback.title') }}
            </h6>
            <p class="text-rui-text-secondary text-xs">
              {{ t('account.subscriptions.cancellation.feedback.description') }}
            </p>
          </div>
        </div>

        <div
          v-if="reasonsLoading"
          class="flex justify-center py-4"
        >
          <RuiProgress
            circular
            variant="indeterminate"
            color="primary"
            size="24"
          />
        </div>

        <template v-else>
          <div class="grid grid-cols-2 gap-1.5">
            <div
              v-for="reason in reasons"
              :key="reason.value"
              class="flex items-center rounded-md border px-2.5 py-1.5 cursor-pointer transition-colors"
              :class="[
                selectedReason === reason.value
                  ? 'border-rui-primary bg-rui-primary/5'
                  : 'border-rui-grey-300 hover:border-rui-grey-400',
                isOtherReason(reason) && reasons.length % 2 !== 0
                  ? 'col-span-2'
                  : '',
              ]"
              @click="selectReason(reason.value)"
            >
              <RuiRadio
                :model-value="selectedReason"
                :value="reason.value"
                :label="reason.label"
                color="primary"
                :hide-details="true"
                size="sm"
              />
            </div>
          </div>

          <Transition name="fade">
            <RuiTextArea
              v-if="selectedReason"
              v-model="comment"
              :label="isOtherSelected
                ? t('account.subscriptions.cancellation.feedback.comment_required')
                : t('account.subscriptions.cancellation.feedback.comment_label')"
              variant="outlined"
              color="primary"
              :rows="2"
              :error-messages="isOtherSelected && comment.trim().length === 0
                ? [t('account.subscriptions.cancellation.feedback.comment_required')]
                : undefined"
            />
          </Transition>
        </template>
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
          :disabled="!isValid"
          @click="cancelSubscription()"
        >
          {{ t('account.subscriptions.cancellation.actions.yes') }}
        </RuiButton>
      </div>
    </RuiCard>
  </RuiDialog>
</template>
