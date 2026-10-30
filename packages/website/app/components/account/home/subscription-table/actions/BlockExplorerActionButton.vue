<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { useActionButtonStyle } from '~/components/account/home/subscription-table/types';
import ButtonLink from '~/components/common/ButtonLink.vue';

defineProps<{
  actionsClasses?: string;
  to: RouteLocationRaw;
}>();

const { t } = useI18n({ useScope: 'global' });

const buttonStyle = useActionButtonStyle();
</script>

<template>
  <RuiTooltip :class-names="{ tooltip: 'w-48' }">
    <template #activator>
      <ButtonLink
        external
        icon
        color="primary"
        :class="actionsClasses"
        :size="buttonStyle.size"
        :variant="buttonStyle.variant"
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
