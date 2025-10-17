<script setup lang="ts">
interface Props {
  loading?: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="flex items-center gap-2 text-h6 mb-6">
    {{ t('account.subscriptions.title') }}
    <RuiButton
      variant="text"
      color="primary"
      icon
      :loading="loading"
      class="!p-2"
      @click="emit('refresh')"
    >
      <RuiIcon
        name="lu-refresh-cw"
        size="16"
      />
    </RuiButton>
  </div>
</template>
