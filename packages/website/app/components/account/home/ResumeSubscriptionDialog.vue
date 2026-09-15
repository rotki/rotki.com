<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { get, isDefined } from '@vueuse/shared';
import ResumeSubscriptionDetails from '~/components/account/home/ResumeSubscriptionDetails.vue';

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
          <ResumeSubscriptionDetails :subscription="modelValue" />
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
