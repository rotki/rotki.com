<script setup lang="ts">
const { resumeStatus } = defineProps<{
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
</script>

<template>
  <RuiTooltip :disabled="!disabled">
    <template #activator>
      <RuiButton
        :loading="loading"
        :disabled="disabled"
        variant="text"
        type="button"
        color="info"
        size="sm"
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
    <span v-if="resumeStatus">
      {{ statusMessage }}
    </span>
    <span v-else-if="nextActionDate">
      {{ t('account.subscriptions.resume_hint', { date: nextActionDate }) }}
    </span>
  </RuiTooltip>
</template>
