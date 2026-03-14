<script setup lang="ts">
defineProps<{
  actionsClasses?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <RuiButton
    variant="text"
    type="button"
    color="primary"
    :class="actionsClasses"
    size="sm"
    @click="emit('click')"
  >
    <template #prepend>
      <RuiIcon
        name="lu-circle-arrow-up"
        size="12"
      />
    </template>
    {{ t('account.subscriptions.upgrade.upgrade') }}
  </RuiButton>
</template>
