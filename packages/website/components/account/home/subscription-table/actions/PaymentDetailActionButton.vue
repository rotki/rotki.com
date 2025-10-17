<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';

interface Props {
  actionsClasses?: string;
  disabled?: boolean;
  to: RouteLocationRaw;
}

defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <ButtonLink
    :disabled="disabled"
    :to="to"
    :class="actionsClasses"
    color="primary"
    size="sm"
  >
    <template #prepend>
      <RuiIcon
        name="lu-circle-arrow-right"
        size="12"
      />
    </template>
    {{ t('account.subscriptions.payment_detail') }}
  </ButtonLink>
</template>
