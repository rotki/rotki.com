<script setup lang="ts">
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

const showTooltip = computed<boolean>(() => !!disabled);

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
</script>

<template>
  <RuiTooltip :disabled="!showTooltip">
    <template #activator>
      <RuiButton
        :loading="loading"
        :disabled="disabled"
        variant="text"
        type="button"
        color="error"
        :class="actionsClasses"
        size="sm"
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
    <span v-if="cancellationStatus">
      {{ statusMessage }}
    </span>
  </RuiTooltip>
</template>
