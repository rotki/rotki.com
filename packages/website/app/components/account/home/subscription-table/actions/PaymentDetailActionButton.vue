<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import { useActionButtonStyle } from '~/components/account/home/subscription-table/types';
import ButtonLink from '~/components/common/ButtonLink.vue';

defineProps<{
  actionsClasses?: string;
  disabled?: boolean;
  to: RouteLocationRaw;
}>();

const { t } = useI18n({ useScope: 'global' });

const buttonStyle = useActionButtonStyle();
</script>

<template>
  <ButtonLink
    :disabled="disabled"
    :to="to"
    :class="actionsClasses"
    color="primary"
    :size="buttonStyle.size"
    :variant="buttonStyle.variant"
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
