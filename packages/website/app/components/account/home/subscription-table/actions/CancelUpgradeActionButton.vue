<script setup lang="ts">
import { RuiButton, RuiIcon } from '@rotki/ui-library/components';
import { useI18n } from 'vue-i18n';
import { useActionButtonStyle } from '~/components/account/home/subscription-table/types';

defineProps<{
  actionsClasses?: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  click: [];
}>();

const { t } = useI18n({ useScope: 'global' });

const buttonStyle = useActionButtonStyle();
</script>

<template>
  <RuiButton
    color="error"
    :variant="buttonStyle.variant"
    :size="buttonStyle.size"
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
