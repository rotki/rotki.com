<script setup lang="ts">
import { get } from '@vueuse/shared';
import { useActionButtonStyle } from '~/components/account/home/subscription-table/types';

const { actionsClasses, loading, disabled, cancellationStatus } = defineProps<{
  actionsClasses?: string;
  loading?: boolean;
  disabled?: boolean;
  cancellationStatus?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n({ useScope: 'global' });

const statusMessage = computed<string>(() => {
  switch (cancellationStatus) {
    case 'pending':
      return t('account.subscriptions.cancellation.status.pending');
    case 'in_progress':
      return t('account.subscriptions.cancellation.status.in_progress');
    case 'completed':
      return t('account.subscriptions.cancellation.status.completed');
    case 'failed':
      return t('account.subscriptions.cancellation.status.failed');
    default:
      return '';
  }
});

/** A disabled button explains itself, but only once there is a status to show. */
const showTooltip = computed<boolean>(() => !!disabled && get(statusMessage).length > 0);

const buttonStyle = useActionButtonStyle();
</script>

<template>
  <RuiTooltip :disabled="!showTooltip">
    <template #activator>
      <RuiButton
        :loading="loading"
        :disabled="disabled"
        :variant="buttonStyle.variant"
        type="button"
        color="error"
        :class="actionsClasses"
        :size="buttonStyle.size"
        @click="emit('click')"
      >
        <template #prepend>
          <RuiIcon
            name="lu-circle-x"
            size="12"
          />
        </template>
        {{ t('account.subscriptions.actions.cancel') }}
      </RuiButton>
    </template>
    {{ statusMessage }}
  </RuiTooltip>
</template>
