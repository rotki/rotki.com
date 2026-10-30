<script setup lang="ts">
import { useActionButtonStyle } from '~/components/account/home/subscription-table/types';

defineProps<{
  actionsClasses?: string;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n({ useScope: 'global' });

const buttonStyle = useActionButtonStyle();
</script>

<template>
  <RuiButton
    :variant="buttonStyle.variant"
    type="button"
    color="primary"
    :class="actionsClasses"
    :size="buttonStyle.size"
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
