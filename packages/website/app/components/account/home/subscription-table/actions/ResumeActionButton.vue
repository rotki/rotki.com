<script setup lang="ts">
interface Props {
  actionsClasses?: string;
  loading?: boolean;
  disabled?: boolean;
  subscriptionId?: string;
  resumeStatus?: string;
  nextActionDate?: string;
}

defineProps<Props>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n({ useScope: 'global' });
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
      {{ t(`account.subscriptions.resume.status.${resumeStatus}`) }}
    </span>
    <span v-else-if="nextActionDate">
      {{ t('account.subscriptions.resume_hint', { date: nextActionDate }) }}
    </span>
  </RuiTooltip>
</template>
