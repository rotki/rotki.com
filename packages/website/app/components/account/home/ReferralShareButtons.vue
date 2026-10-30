<script setup lang="ts">
import type { Component } from 'vue';

export interface ShareButton {
  icon?: string;
  customIcon?: Component;
  name: string;
  url: string;
  colorClass: string;
}

defineProps<{
  buttons: ShareButton[];
}>();

const { t } = useI18n({ useScope: 'global' });

function shareLabel({ name }: ShareButton): string {
  return name === 'Email' ? t('account.referral_code.share_by_email') : t('account.referral_code.share_on', { name });
}
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="text-body-2 text-rui-text-secondary">{{ t('account.referral_code.share_via') }}</span>
    <div class="flex items-center gap-1">
      <a
        v-for="button in buttons"
        :key="button.name"
        :href="button.url"
        :target="button.name !== 'Email' ? '_blank' : undefined"
        :rel="button.name !== 'Email' ? 'noopener noreferrer' : undefined"
        :aria-label="shareLabel(button)"
        class="inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-rui-grey-100 dark:hover:bg-rui-grey-800 focus-visible:outline-2 focus-visible:outline-rui-primary"
      >
        <Component
          :is="button.customIcon"
          v-if="button.customIcon"
          :class="button.colorClass"
        />
        <RuiIcon
          v-else-if="button.icon"
          :name="button.icon"
          size="18"
          :class="button.colorClass"
        />
      </a>
    </div>
  </div>
</template>
