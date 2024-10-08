<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import type { Subscription } from '~/types';

const modelValue = defineModel<Subscription | undefined>({ required: true });

const emit = defineEmits<{
  confirm: [val: Subscription];
}>();

const { t } = useI18n();

const { resumeError } = storeToRefs(useMainStore());

const display = computed({
  get() {
    return !!get(modelValue);
  },
  set(value) {
    if (!value)
      set(modelValue, undefined);
  },
});

async function resumeSubscription() {
  if (!isDefined(modelValue))
    return;
  emit('confirm', get(modelValue));
  set(modelValue, undefined);
}
</script>

<template>
  <RuiDialog
    v-model="display"
    max-width="900"
  >
    <RuiCard>
      <template #header>
        {{ t('account.subscriptions.resume.title') }}
      </template>

      <div class="whitespace-break-spaces mb-4">
        <div v-if="!!modelValue">
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
                  <span class="font-normal">{{ modelValue.nextActionDate }}</span>
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
          color="info"
          @click="resumeSubscription()"
        >
          {{ t('account.subscriptions.resume.actions.yes') }}
        </RuiButton>
      </div>
    </RuiCard>
  </RuiDialog>

  <FloatingNotification
    :timeout="3000"
    :visible="!!resumeError"
    closeable
    @dismiss="resumeError = ''"
  >
    <template #title>
      {{ t('account.subscriptions.resume.notification.title') }}
    </template>
    {{ resumeError }}
  </FloatingNotification>
</template>
