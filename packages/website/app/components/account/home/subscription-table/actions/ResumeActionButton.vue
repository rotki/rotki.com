<script setup lang="ts">
import { get } from '@vueuse/shared';
import { useActionButtonStyle } from '~/components/account/home/subscription-table/types';
import { formatDate } from '~/utils/date';

const { disabled, resumeStatus, nextActionDate } = defineProps<{
  actionsClasses?: string;
  loading?: boolean;
  disabled?: boolean;
  resumeStatus?: string;
  nextActionDate?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n({ useScope: 'global' });

const statusMessage = computed<string>(() => {
  switch (resumeStatus) {
    case 'pending':
      return t('account.subscriptions.resume.status.pending');
    case 'in_progress':
      return t('account.subscriptions.resume.status.in_progress');
    case 'completed':
      return t('account.subscriptions.resume.status.completed');
    case 'failed':
      return t('account.subscriptions.resume.status.failed');
    default:
      return '';
  }
});

/** What a disabled button says: the running operation's status, else when billing would start again. */
const tooltip = computed<string>(() => {
  if (!disabled)
    return '';
  const status = get(statusMessage);
  if (status)
    return status;
  return nextActionDate ? t('account.subscriptions.resume_hint', { date: formatDate(nextActionDate) }) : '';
});

const buttonStyle = useActionButtonStyle();
</script>

<template>
  <RuiTooltip :disabled="!tooltip">
    <template #activator>
      <RuiButton
        :loading="loading"
        :disabled="disabled"
        :variant="buttonStyle.variant"
        type="button"
        color="primary"
        :size="buttonStyle.size"
        :class="actionsClasses"
        @click="emit('click')"
      >
        <template #prepend>
          <RuiIcon
            name="lu-circle-play"
            size="12"
          />
        </template>
        {{ t('account.subscriptions.actions.resume') }}
      </RuiButton>
    </template>
    {{ tooltip }}
  </RuiTooltip>
</template>
