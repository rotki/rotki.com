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
</script>

<template>
  <div class="flex items-center gap-3">
    <span class="text-body-2 text-rui-text-secondary">{{ t('account.referral_code.share_via') }}</span>
    <div class="flex items-center gap-2">
      <a
        v-for="button in buttons"
        :key="button.name"
        :href="button.url"
        :target="button.name !== 'Email' ? '_blank' : undefined"
        :rel="button.name !== 'Email' ? 'noopener noreferrer' : undefined"
      >
        <RuiButton
          variant="text"
          size="sm"
          color="secondary"
          class="!p-2 !min-w-0"
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
        </RuiButton>
      </a>
    </div>
  </div>
</template>
