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

const { t } = useI18n({ useScope: 'global' });

async function resumeSubscription(): Promise<void> {
  if (!isDefined(modelValue))
    return;

  emit('confirm', get(modelValue));
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
        {{ t('account.subscriptions.resume.title') }}
      </template>

      <div class="whitespace-break-spaces mb-4">
        <div v-if="modelValue">
          <ul class="list-disc ml-5 font-medium">
            <li>
              <i18n-t
                keypath="account.subscriptions.resume.details.plan_name"
                class="font-medium"
              >
                <template #plan>
                  <span class="font-normal">{{ modelValue.planName }}</span>
                </template>
              </i18n-t>
            </li>
            <li>
              <i18n-t
                keypath="account.subscriptions.resume.details.billing_cycle"
                class="font-medium"
              >
                <template #duration>
                  <span class="font-normal">
                    {{ t('account.subscriptions.resume.details.duration_in_months', { duration: modelValue.durationInMonths }) }}
                  </span>
                </template>
              </i18n-t>
            </li>

            <li>
              <i18n-t
                keypath="account.subscriptions.resume.details.billing_amount"
                class="font-medium"
              >
                <template #amount>
                  <span class="font-normal">
                    {{ t('account.subscriptions.resume.details.amount_in_eur', { amount: modelValue.nextBillingAmount }) }}
                  </span>
                </template>
              </i18n-t>
            </li>

            <li>
              <i18n-t
                keypath="account.subscriptions.resume.details.next_billing_date"
                class="font-medium"
              >
                <template #date>
                  <span class="font-normal">{{ formatDate(modelValue.nextActionDate) }}</span>
                </template>
              </i18n-t>
            </li>
          </ul>
        </div>
        <div class="mt-4">
          {{ t('account.subscriptions.resume.description') }}
        </div>
      </div>

      <div class="flex justify-end gap-4 pt-4">
        <RuiButton
          color="primary"
          variant="text"
          @click="modelValue = undefined"
        >
          {{ t('account.subscriptions.resume.actions.no') }}
        </RuiButton>

        <RuiButton
          color="primary"
          @click="resumeSubscription()"
        >
          {{ t('account.subscriptions.resume.actions.yes') }}
        </RuiButton>
      </div>
    </RuiCard>
  </RuiDialog>
</template>
