<script setup lang="ts">
interface Props {
  actionsClasses?: string;
  loading?: boolean;
  disabled?: boolean;
  subscriptionId?: string;
  cancellationStatus?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n({ useScope: 'global' });

const showTooltip = computed<boolean>(() => props.disabled);
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
      {{ t(`account.subscriptions.cancellation.status.${cancellationStatus}`) }}
    </span>
  </RuiTooltip>
</template>
