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
    size="sm"
    color="info"
  >
    <template #prepend>
      <RuiIcon
        name="lu-repeat"
        size="12"
      />
    </template>
    {{ t('actions.renew') }}
  </ButtonLink>
</template>
