<script setup lang="ts">
import type { Subscription as UserSubscription } from '@rotki/card-payment-common/schemas/subscription';
import { get, isDefined } from '@vueuse/shared';

const modelValue = defineModel<UserSubscription | undefined>({ required: true });

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  confirm: [subscriptionId: string];
}>();

function confirmCancelUpgrade(): void {
  if (!isDefined(modelValue))
    return;

  emit('confirm', get(modelValue).id);
}

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <RuiDialog
    :model-value="!!modelValue && !loading"
    max-width="600"
    @closed="modelValue = undefined"
  >
    <RuiCard>
      <template #header>
        {{ t('account.subscriptions.upgrade.cancel_dialog.title') }}
      </template>

      <div class="whitespace-break-spaces mb-4">
        {{ t('account.subscriptions.upgrade.cancel_dialog.description') }}
      </div>

      <div class="flex justify-end gap-4 pt-4">
        <RuiButton
          color="primary"
          variant="text"
          @click="modelValue = undefined"
        >
          {{ t('account.subscriptions.upgrade.cancel_dialog.actions.no') }}
        </RuiButton>

        <RuiButton
          color="warning"
          @click="confirmCancelUpgrade()"
        >
          {{ t('account.subscriptions.upgrade.cancel_dialog.actions.yes') }}
        </RuiButton>
      </div>
    </RuiCard>
  </RuiDialog>
</template>
