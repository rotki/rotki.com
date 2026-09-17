<script setup lang="ts">
import type { ActiveCampaign } from '@rotki/card-payment-common/schemas/campaign';
import { formatCampaignLastDay } from '@rotki/card-payment-common/utils/campaign';
import { computed } from 'vue';
import { en } from '@/i18n/en';

const { campaign, applied = false } = defineProps<{
  campaign: ActiveCampaign;
  /** The campaign code is already applied to this checkout. */
  applied?: boolean;
}>();

/** Message split around the code, so the code itself can be emphasized. */
const parts = computed<[string, string]>(() => {
  const template = applied ? en.campaign.applied : en.campaign.offer;
  const [before = '', after = ''] = template.replace('{percent}', String(campaign.percent)).split('{code}');
  return [before, after];
});

const lastDay = computed<string | undefined>(() => (applied ? undefined : formatCampaignLastDay(campaign.periodEnd)));
</script>

<template>
  <div class="px-4 py-2 text-sm text-rui-primary text-center font-medium border-b border-rui-grey-200 w-full bg-rui-primary/[0.06]">
    {{ parts[0] }}<strong class="font-bold tracking-wide">{{ campaign.code }}</strong>{{ parts[1] }}
    <template v-if="lastDay">
      {{ en.campaign.lastDay(lastDay) }}
    </template>
  </div>
</template>
