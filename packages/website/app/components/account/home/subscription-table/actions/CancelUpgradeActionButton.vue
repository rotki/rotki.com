<script setup lang="ts">
interface Props {
  actionsClasses?: string;
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <RuiButton
    color="warning"
    variant="text"
    size="sm"
    :class="actionsClasses"
    :loading="loading"
    @click="emit('click')"
  >
    <template #prepend>
      <RuiIcon
        name="lu-circle-x"
        size="12"
      />
    </template>
    {{ t('account.subscriptions.upgrade.cancel') }}
  </RuiButton>
</template>
