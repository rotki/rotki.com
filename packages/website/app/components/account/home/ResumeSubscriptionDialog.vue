<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { formatEur } from '@rotki/card-payment-common/utils/money';
import { formatPlanName } from '@rotki/card-payment-common/utils/plan';
import { get, isDefined } from '@vueuse/shared';
import { formatDate } from '~/utils/date';

const modelValue = defineModel<UserSubscription | undefined>({ required: true });

const { loading } = defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  confirm: [val: UserSubscription];
}>();

const { t } = useI18n({ useScope: 'global' });

const nextPayment = computed<string>(() => formatDate(get(modelValue)?.nextActionDate));

const details = computed<{ label: string; value: string }[]>(() => {
  const subscription = get(modelValue);
  if (!subscription)
    return [];

  return [
    {
      label: t('account.subscriptions.resume.details.plan'),
      value: formatPlanName(subscription.planName),
    },
    {
      label: t('account.subscriptions.resume.details.billing'),
      value: t('account.subscriptions.resume.details.every_months', { n: subscription.durationInMonths }, subscription.durationInMonths),
    },
    {
      label: t('account.subscriptions.resume.details.next_payment'),
      value: t('account.subscriptions.resume.details.amount_on_date', {
        amount: formatEur(subscription.nextBillingAmount),
        date: get(nextPayment),
      }),
    },
  ];
});

function resumeSubscription(): void {
  if (!isDefined(modelValue))
    return;

  emit('confirm', get(modelValue));
}
</script>

<template>
  <RuiDialog
    :model-value="!!modelValue && !loading"
    max-width="560"
    @closed="modelValue = undefined"
  >
    <RuiCard>
      <template #header>
        {{ t('account.subscriptions.resume.title') }}
      </template>

      <p class="mb-4">
        {{ t('account.subscriptions.resume.description', { date: nextPayment }) }}
      </p>

      <dl
        class="rounded-lg border border-rui-grey-300 divide-y divide-rui-grey-300 text-sm"
        data-testid="resume-details"
      >
        <div
          v-for="detail in details"
          :key="detail.label"
          class="flex items-baseline justify-between gap-4 px-4 py-3"
        >
          <dt class="text-rui-text-secondary">
            {{ detail.label }}
          </dt>
          <dd class="font-medium text-right">
            {{ detail.value }}
          </dd>
        </div>
      </dl>

      <div class="flex flex-wrap justify-end gap-4 pt-6">
        <RuiButton
          color="primary"
          variant="outlined"
          @click="modelValue = undefined"
        >
          {{ t('account.subscriptions.resume.actions.keep_canceled') }}
        </RuiButton>

        <RuiButton
          color="primary"
          @click="resumeSubscription()"
        >
          {{ t('account.subscriptions.resume.actions.resume') }}
        </RuiButton>
      </div>
    </RuiCard>
  </RuiDialog>
</template>
