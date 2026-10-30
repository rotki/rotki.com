<script setup lang="ts">
defineProps<{
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <RuiButton
    variant="text"
    color="primary"
    icon
    :loading="loading"
    :disabled="disabled"
    :aria-label="t('actions.refresh')"
    @click="emit('refresh')"
  >
    <RuiIcon
      name="lu-refresh-cw"
      size="16"
    />
  </RuiButton>
</template>
