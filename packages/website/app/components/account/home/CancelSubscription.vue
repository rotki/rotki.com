<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import type { CancelSubscriptionConfirmEvent } from '~/components/account/home/subscription-table/types';
import { formatEur } from '@rotki/card-payment-common/utils/money';
import { formatPlanName } from '@rotki/card-payment-common/utils/plan';
import { get, isDefined, set } from '@vueuse/shared';
import { useCancellationFeedback } from '~/composables/subscription/use-cancellation-feedback';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { formatDate } from '~/utils/date';

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
  modelReason,
  modelComment,
  isOtherReason,
  isOtherSelected,
  isValid,
  fetchReasons,
  reset,
} = useCancellationFeedback();
const { availablePlans } = useAvailablePlans();

const isPending = computed<boolean>(() => get(modelValue)?.status === 'Pending');

/** The last day the plan stays active, which is also its next billing date. */
const endDate = computed<string>(() => formatDate(get(modelValue)?.nextActionDate));

/**
 * The cheapest monthly plan below the one being cancelled. A plan cannot be moved to a lower one,
 * so this is offered as a new subscription once the current plan has ended.
 */
const cheaperPlan = computed<{ name: string; price: string } | undefined>(() => {
  const subscription = get(modelValue);
  if (!subscription)
    return undefined;

  const monthly = get(availablePlans).flatMap(plan => plan.monthlyPlan ? [{ name: plan.tierName, price: Number(plan.monthlyPlan.price) }] : []);
  const current = monthly.find(plan => plan.name.toLowerCase() === subscription.planName.toLowerCase());
  if (!current)
    return undefined;

  const cheapest = monthly
    .filter(plan => plan.price > 0 && plan.price < current.price)
    .toSorted((a, b) => a.price - b.price)[0];
  return cheapest ? { name: formatPlanName(cheapest.name), price: formatEur(cheapest.price) } : undefined;
});

watch(modelValue, (val) => {
  if (val) {
    fetchReasons();
  }
  else {
    reset();
  }
}, { immediate: true });

function selectReason(value: number): void {
  set(modelReason, value);
}

function cancelSubscription(): void {
  if (!isDefined(modelValue))
    return;

  emit('confirm', {
    subscription: get(modelValue),
    feedback: {
      reason: get(modelReason)!,
      feedback: get(modelComment),
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

      <p
        v-if="isPending"
        class="mb-4"
      >
        {{ t('account.subscriptions.cancellation.pending') }}
      </p>
      <template v-else>
        <p class="mb-4">
          {{ t('account.subscriptions.cancellation.active_until', { date: endDate }) }}
        </p>
        <div
          class="rounded-lg border border-rui-grey-300 p-4 mb-4"
          data-cy="cancellation-consequences"
        >
          <h6 class="text-sm font-bold leading-snug mb-2">
            {{ t('account.subscriptions.cancellation.after.title', { date: endDate }) }}
          </h6>
          <ul class="list-disc ml-5 space-y-1 text-sm">
            <li>{{ t('account.subscriptions.cancellation.after.free_limits') }}</li>
            <li>{{ t('account.subscriptions.cancellation.after.premium_off') }}</li>
            <li>{{ t('account.subscriptions.cancellation.after.data_stays') }}</li>
            <li>{{ t('account.subscriptions.cancellation.after.resubscribe') }}</li>
          </ul>
        </div>
        <p
          v-if="cheaperPlan"
          class="rounded-lg bg-rui-primary/5 px-4 py-3 mb-4 text-sm"
          data-cy="cancellation-cheaper-plan"
        >
          {{ t('account.subscriptions.cancellation.cheaper_plan', { date: endDate, plan: cheaperPlan.name, price: cheaperPlan.price }) }}
        </p>
      </template>

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
                modelReason === reason.value
                  ? 'border-rui-primary bg-rui-primary/5'
                  : 'border-rui-grey-300 hover:border-rui-grey-400',
                isOtherReason(reason) && reasons.length % 2 !== 0
                  ? 'col-span-2'
                  : '',
              ]"
              @click="selectReason(reason.value)"
            >
              <RuiRadio
                :model-value="modelReason"
                :value="reason.value"
                :label="reason.label"
                color="primary"
                hide-details
                size="sm"
              />
            </div>
          </div>

          <Transition name="fade">
            <RuiTextArea
              v-if="modelReason"
              v-model="modelComment"
              :label="isOtherSelected
                ? t('account.subscriptions.cancellation.feedback.comment_required')
                : t('account.subscriptions.cancellation.feedback.comment_label')"
              color="primary"
              :rows="2"
              :error-messages="isOtherSelected && modelComment.trim().length === 0
                ? [t('account.subscriptions.cancellation.feedback.comment_required')]
                : undefined"
            />
          </Transition>
        </template>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-4 pt-4">
        <p class="text-sm text-rui-text-secondary">
          {{ t('account.subscriptions.cancellation.confirmation_email') }}
        </p>
        <div class="flex gap-4 ml-auto">
          <RuiButton
            color="primary"
            variant="outlined"
            @click="modelValue = undefined"
          >
            {{ t('account.subscriptions.cancellation.actions.keep') }}
          </RuiButton>

          <RuiButton
            color="error"
            :disabled="!isValid"
            @click="cancelSubscription()"
          >
            {{ t('account.subscriptions.cancellation.actions.cancel') }}
          </RuiButton>
        </div>
      </div>
    </RuiCard>
  </RuiDialog>
</template>
