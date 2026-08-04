<script setup lang="ts">
import { get } from '@vueuse/shared';
import { useAppConfig } from '~/composables/use-app-config';

const { t } = useI18n({ useScope: 'global' });

const { activeCampaign } = useAppConfig();

const message = computed<string>(() => {
  const campaign = get(activeCampaign);
  if (!campaign)
    return '';

  const base = t('campaign.ribbon', { code: campaign.code, percent: campaign.percent });
  if (!campaign.periodEnd)
    return base;

  const end = new Date(campaign.periodEnd);
  if (Number.isNaN(end.getTime()))
    return base;

  return `${base} ${t('campaign.ribbon_until', {
    date: end.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
  })}`;
});
</script>

<template>
  <div
    v-if="activeCampaign"
    class="px-4 py-2 text-body-2 text-rui-primary text-center font-medium border-b border-default w-full bg-rui-primary/[0.06]"
  >
    {{ message }}
  </div>
</template>
