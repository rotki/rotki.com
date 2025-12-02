<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import ButtonLink from '~/components/common/ButtonLink.vue';

interface Props {
  actionsClasses?: string;
  to: RouteLocationRaw;
}

defineProps<Props>();

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <RuiTooltip tooltip-class="w-48">
    <template #activator>
      <ButtonLink
        external
        icon
        color="primary"
        :class="actionsClasses"
        size="sm"
        :to="to"
      >
        <template #prepend>
          <RuiIcon
            name="lu-link"
            size="12"
          />
        </template>
        {{ t('account.subscriptions.explorer') }}
      </ButtonLink>
    </template>
    {{ t('account.subscriptions.pending_tx') }}
  </RuiTooltip>
</template>
